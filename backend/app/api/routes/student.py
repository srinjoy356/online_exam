"""
app/api/routes/student.py
--------------------------
Protected student routes.

  GET  /student/exams
  GET  /student/exams/{exam_id}/attempt-status   ← NEW
  POST /student/exams/{exam_id}/start
  POST /student/exams/submit
  GET  /student/results/{attempt_id}
  GET  /student/stats                            ← NEW
"""
import random
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.models import (
    Exam, Question, Option, Student,
    ExamAttempt, Response, Result,
)
from app.schemas.schemas import (
    ExamOut, ExamStartResponse, QuestionOut,
    ExamSubmitRequest, AttemptStatusOut, StudentStatsOut,
)
from app.api.deps import get_current_student

router = APIRouter(prefix="/student", tags=["Student"])


def _serialize_question(q: Question) -> dict:
    return {
        "id": q.id,
        "question_text": q.question_text,
        "options": [
            {"id": o.id, "option_text": o.option_text, "option_order": o.option_order}
            for o in q.options
        ],
    }


# ══════════════════════════════════════════════════════════
# LIST EXAMS
# ══════════════════════════════════════════════════════════

@router.get("/exams", response_model=list[ExamOut])
def list_exams_for_student(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    return (
        db.query(Exam)
        .filter(Exam.admin_id == student.admin_id, Exam.is_active == True)
        .all()
    )


# ══════════════════════════════════════════════════════════
# NEW: ATTEMPT STATUS CHECK
# ══════════════════════════════════════════════════════════

@router.get("/exams/{exam_id}/attempt-status", response_model=AttemptStatusOut)
def get_attempt_status(
    exam_id: int,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Returns how many attempts the student has used, the max allowed,
    and whether they can still attempt the exam.
    """
    exam = db.query(Exam).filter(
        Exam.id == exam_id,
        Exam.admin_id == student.admin_id,
        Exam.is_active == True,
    ).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    used = db.query(ExamAttempt).filter(
        ExamAttempt.student_id == student.id,
        ExamAttempt.exam_id == exam_id,
        ExamAttempt.is_completed == True,
    ).count()

    return AttemptStatusOut(
        attempts_used=used,
        max_attempts=exam.max_attempts,
        can_attempt=used < exam.max_attempts,
    )


# ══════════════════════════════════════════════════════════
# START EXAM
# ══════════════════════════════════════════════════════════

@router.post("/exams/{exam_id}/start", response_model=dict)
def start_exam(
    exam_id: int,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    exam = (
        db.query(Exam)
        .options(selectinload(Exam.questions).selectinload(Question.options))
        .filter(Exam.id == exam_id, Exam.admin_id == student.admin_id, Exam.is_active == True)
        .first()
    )
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    # ── Enforce max_attempts ──────────────────────────────
    completed_count = db.query(ExamAttempt).filter(
        ExamAttempt.student_id == student.id,
        ExamAttempt.exam_id == exam_id,
        ExamAttempt.is_completed == True,
    ).count()

    if completed_count >= exam.max_attempts:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Maximum attempts ({exam.max_attempts}) reached for this exam.",
        )

    all_questions: List[Question] = exam.questions
    if len(all_questions) < exam.num_questions:
        raise HTTPException(
            status_code=400,
            detail=f"Exam has only {len(all_questions)} questions but requires {exam.num_questions}.",
        )

    # Resume any existing incomplete attempt
    existing = (
        db.query(ExamAttempt)
        .filter(
            ExamAttempt.student_id == student.id,
            ExamAttempt.exam_id == exam_id,
            ExamAttempt.is_completed == False,
        )
        .first()
    )

    if existing:
        q_ids = existing.question_order or []
        q_map = {q.id: q for q in all_questions}
        ordered = [q_map[qid] for qid in q_ids if qid in q_map]
        return {
            "attempt_id": existing.id,
            "is_resume": True,
            "time_limit_mins": exam.time_limit_mins,
            "questions": [_serialize_question(q) for q in ordered],
        }

    selected = (
        random.sample(all_questions, exam.num_questions)
        if exam.randomize
        else all_questions[:exam.num_questions]
    )

    attempt = ExamAttempt(
        student_id=student.id,
        exam_id=exam_id,
        question_order=[q.id for q in selected],
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "attempt_id": attempt.id,
        "is_resume": False,
        "time_limit_mins": exam.time_limit_mins,
        "questions": [_serialize_question(q) for q in selected],
    }


# ══════════════════════════════════════════════════════════
# SUBMIT EXAM
# ══════════════════════════════════════════════════════════

@router.post("/exams/submit", response_model=dict)
def submit_exam(
    payload: ExamSubmitRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    attempt = (
        db.query(ExamAttempt)
        .options(selectinload(ExamAttempt.exam))
        .filter(
            ExamAttempt.id == payload.attempt_id,
            ExamAttempt.student_id == student.id,
            ExamAttempt.is_completed == False,
        )
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found or already submitted.")

    exam = attempt.exam
    question_ids = attempt.question_order or []

    questions_in_exam = (
        db.query(Question)
        .options(selectinload(Question.options))
        .filter(Question.id.in_(question_ids))
        .all()
    )
    correct_map = {}
    for q in questions_in_exam:
        for o in q.options:
            if o.is_correct:
                correct_map[q.id] = o.id
                break

    response_map = {r.question_id: r.selected_option_id for r in payload.responses}

    for q_id in question_ids:
        selected = response_map.get(q_id)
        db.add(Response(
            attempt_id=attempt.id,
            question_id=q_id,
            selected_option_id=selected,
        ))

    correct = incorrect = unattempted = 0
    for q_id in question_ids:
        chosen = response_map.get(q_id)
        if chosen is None:
            unattempted += 1
        elif chosen == correct_map.get(q_id):
            correct += 1
        else:
            incorrect += 1

    total_marks = (
        correct * float(exam.positive_marks)
        - incorrect * float(exam.negative_marks)
    )
    is_passed = total_marks >= float(exam.passing_marks)

    result = Result(
        attempt_id=attempt.id,
        correct_answers=correct,
        incorrect_answers=incorrect,
        unattempted=unattempted,
        total_marks=total_marks,
        passing_marks=float(exam.passing_marks),
        is_passed=is_passed,
    )
    db.add(result)

    attempt.is_completed = True
    attempt.submitted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(result)

    return {
        "attempt_id": attempt.id,
        "exam_name": exam.exam_name,
        "total_questions": len(question_ids),
        "correct_answers": correct,
        "incorrect_answers": incorrect,
        "unattempted": unattempted,
        "total_marks": total_marks,
        "passing_marks": float(exam.passing_marks),
        "is_passed": is_passed,
        "calculated_at": result.calculated_at,
    }


# ══════════════════════════════════════════════════════════
# GET RESULT
# ══════════════════════════════════════════════════════════

@router.get("/results/{attempt_id}", response_model=dict)
def get_result(
    attempt_id: int,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    attempt = (
        db.query(ExamAttempt)
        .options(selectinload(ExamAttempt.exam), selectinload(ExamAttempt.result))
        .filter(
            ExamAttempt.id == attempt_id,
            ExamAttempt.student_id == student.id,
            ExamAttempt.is_completed == True,
        )
        .first()
    )
    if not attempt or not attempt.result:
        raise HTTPException(status_code=404, detail="Result not found.")

    r = attempt.result
    return {
        "attempt_id": attempt.id,
        "exam_name": attempt.exam.exam_name,
        "total_questions": len(attempt.question_order or []),
        "correct_answers": r.correct_answers,
        "incorrect_answers": r.incorrect_answers,
        "unattempted": r.unattempted,
        "total_marks": float(r.total_marks),
        "passing_marks": float(r.passing_marks),
        "is_passed": r.is_passed,
        "calculated_at": r.calculated_at,
    }


# ══════════════════════════════════════════════════════════
# NEW: STUDENT STATS
# ══════════════════════════════════════════════════════════

@router.get("/stats", response_model=StudentStatsOut)
def get_student_stats(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """
    Returns aggregate stats for the student across all exams:
    total attempts, average score, exams passed, exams failed.
    """
    attempts = (
        db.query(ExamAttempt)
        .options(selectinload(ExamAttempt.result))
        .filter(
            ExamAttempt.student_id == student.id,
            ExamAttempt.is_completed == True,
        )
        .all()
    )

    results = [a.result for a in attempts if a.result]
    total   = len(results)
    passed  = sum(1 for r in results if r.is_passed)
    failed  = total - passed
    avg     = round(sum(float(r.total_marks) for r in results) / total, 2) if total else 0.0

    return StudentStatsOut(
        total_attempts=total,
        average_score=avg,
        exams_passed=passed,
        exams_failed=failed,
    )
