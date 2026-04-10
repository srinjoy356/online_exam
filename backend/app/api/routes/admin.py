"""
app/api/routes/admin.py
-----------------------
Protected admin routes.

Exams
  POST   /admin/exams
  GET    /admin/exams
  GET    /admin/exams/{exam_id}
  DELETE /admin/exams/{exam_id}
  GET    /admin/exams/{exam_id}/results   ← NEW

Questions
  POST   /admin/exams/{exam_id}/questions
  DELETE /admin/exams/{exam_id}/questions/{q_id}

Students
  POST   /admin/students
  GET    /admin/students
  DELETE /admin/students/{s_id}
  GET    /admin/students/{student_id}/attempts  ← NEW
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func

from app.db.session import get_db
from app.models.models import Admin, Exam, Question, Option, Student, ExamAttempt, Result
from app.schemas.schemas import (
    ExamCreateRequest, ExamOut,
    QuestionCreateRequest, QuestionOutAdmin,
    StudentCreateRequest, StudentOut,
    MessageResponse,
    ExamAttemptResultRow, StudentProfileOut, StudentAttemptRow,
)
from app.api.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


# ══════════════════════════════════════════════════════════
# EXAM MANAGEMENT
# ══════════════════════════════════════════════════════════

@router.post("/exams", response_model=ExamOut, status_code=status.HTTP_201_CREATED)
def create_exam(
    payload: ExamCreateRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    exam = Exam(
        admin_id=admin.id,
        exam_name=payload.exam_name,
        num_questions=payload.num_questions,
        time_limit_mins=payload.time_limit_mins,
        positive_marks=payload.positive_marks,
        negative_marks=payload.negative_marks,
        passing_marks=payload.passing_marks,
        randomize=payload.randomize,
        max_attempts=payload.max_attempts,
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


@router.get("/exams", response_model=list[ExamOut])
def list_exams(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return db.query(Exam).filter(Exam.admin_id == admin.id).all()


@router.get("/exams/{exam_id}", response_model=dict)
def get_exam_detail(
    exam_id: int,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    exam = (
        db.query(Exam)
        .options(selectinload(Exam.questions).selectinload(Question.options))
        .filter(Exam.id == exam_id, Exam.admin_id == admin.id)
        .first()
    )
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    return {
        "id": exam.id,
        "exam_name": exam.exam_name,
        "num_questions": exam.num_questions,
        "time_limit_mins": exam.time_limit_mins,
        "positive_marks": float(exam.positive_marks),
        "negative_marks": float(exam.negative_marks),
        "passing_marks": float(exam.passing_marks),
        "is_active": exam.is_active,
        "randomize": exam.randomize,
        "max_attempts": exam.max_attempts,
        "created_at": exam.created_at,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "options": [
                    {
                        "id": o.id,
                        "option_text": o.option_text,
                        "is_correct": o.is_correct,
                        "option_order": o.option_order,
                    }
                    for o in q.options
                ],
            }
            for q in exam.questions
        ],
    }


@router.delete("/exams/{exam_id}", response_model=MessageResponse)
def delete_exam(
    exam_id: int,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.admin_id == admin.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")
    exam.is_active = False
    db.commit()
    return {"message": "Exam deactivated successfully."}


# ── NEW: Exam Results Dashboard ───────────────────────────
@router.get("/exams/{exam_id}/results", response_model=list[ExamAttemptResultRow])
def get_exam_results(
    exam_id: int,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Return every completed attempt for this exam, with student info and result.
    Only returns attempts that have been submitted and scored.
    """
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.admin_id == admin.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    attempts = (
        db.query(ExamAttempt)
        .options(
            selectinload(ExamAttempt.student),
            selectinload(ExamAttempt.result),
        )
        .filter(
            ExamAttempt.exam_id == exam_id,
            ExamAttempt.is_completed == True,
        )
        .order_by(ExamAttempt.submitted_at.desc())
        .all()
    )

    rows = []
    for a in attempts:
        if not a.result:
            continue
        rows.append(ExamAttemptResultRow(
            attempt_id=a.id,
            student_id=a.student.id,
            student_code=a.student.student_code,
            student_name=a.student.student_name,
            started_at=a.started_at,
            submitted_at=a.submitted_at,
            correct_answers=a.result.correct_answers,
            incorrect_answers=a.result.incorrect_answers,
            unattempted=a.result.unattempted,
            total_marks=float(a.result.total_marks),
            passing_marks=float(a.result.passing_marks),
            is_passed=a.result.is_passed,
        ))
    return rows


# ══════════════════════════════════════════════════════════
# QUESTION MANAGEMENT
# ══════════════════════════════════════════════════════════

@router.post(
    "/exams/{exam_id}/questions",
    response_model=QuestionOutAdmin,
    status_code=status.HTTP_201_CREATED,
)
def add_question(
    exam_id: int,
    payload: QuestionCreateRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.admin_id == admin.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    question = Question(exam_id=exam_id, question_text=payload.question_text)
    db.add(question)
    db.flush()

    for opt in payload.options:
        db.add(Option(
            question_id=question.id,
            option_text=opt.option_text,
            is_correct=opt.is_correct,
            option_order=opt.option_order,
        ))

    db.commit()
    db.refresh(question)
    return question


@router.delete("/exams/{exam_id}/questions/{question_id}", response_model=MessageResponse)
def delete_question(
    exam_id: int,
    question_id: int,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.admin_id == admin.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    question = db.query(Question).filter(
        Question.id == question_id, Question.exam_id == exam_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")

    db.delete(question)
    db.commit()
    return {"message": "Question deleted."}


# ══════════════════════════════════════════════════════════
# STUDENT MANAGEMENT
# ══════════════════════════════════════════════════════════

@router.post("/students", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def add_student(
    payload: StudentCreateRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(Student).filter(
        Student.student_code == payload.student_code,
        Student.admin_id == admin.id,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student code already exists in this institute.",
        )

    student = Student(
        admin_id=admin.id,
        student_code=payload.student_code,
        student_name=payload.student_name,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.get("/students", response_model=list[StudentOut])
def list_students(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return (
        db.query(Student)
        .filter(Student.admin_id == admin.id, Student.is_active == True)
        .all()
    )


@router.delete("/students/{student_id}", response_model=MessageResponse)
def delete_student(
    student_id: int,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(
        Student.id == student_id, Student.admin_id == admin.id
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    student.is_active = False
    db.commit()
    return {"message": "Student removed successfully."}


# ── NEW: Student Profile + Attempt History ────────────────
@router.get("/students/{student_id}/attempts", response_model=StudentProfileOut)
def get_student_profile(
    student_id: int,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Return a student's full attempt history with per-attempt results
    and a calculated average score across all completed attempts.
    """
    student = db.query(Student).filter(
        Student.id == student_id, Student.admin_id == admin.id
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    attempts = (
        db.query(ExamAttempt)
        .options(
            selectinload(ExamAttempt.exam),
            selectinload(ExamAttempt.result),
        )
        .filter(
            ExamAttempt.student_id == student_id,
            ExamAttempt.is_completed == True,
        )
        .order_by(ExamAttempt.submitted_at.desc())
        .all()
    )

    rows = []
    total_marks_sum = 0.0
    for a in attempts:
        if not a.result:
            continue
        total_marks_sum += float(a.result.total_marks)
        rows.append(StudentAttemptRow(
            attempt_id=a.id,
            exam_id=a.exam_id,
            exam_name=a.exam.exam_name,
            started_at=a.started_at,
            submitted_at=a.submitted_at,
            correct_answers=a.result.correct_answers,
            incorrect_answers=a.result.incorrect_answers,
            unattempted=a.result.unattempted,
            total_marks=float(a.result.total_marks),
            passing_marks=float(a.result.passing_marks),
            is_passed=a.result.is_passed,
        ))

    avg = round(total_marks_sum / len(rows), 2) if rows else 0.0

    return StudentProfileOut(
        student_id=student.id,
        student_code=student.student_code,
        student_name=student.student_name,
        total_attempts=len(rows),
        average_score=avg,
        attempts=rows,
    )
