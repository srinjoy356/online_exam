"""
app/schemas/schemas.py
"""
from __future__ import annotations
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, model_validator


class MessageResponse(BaseModel):
    message: str


# ══════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════

class AdminRegisterRequest(BaseModel):
    login_name:     str      = Field(..., min_length=3, max_length=80)
    institute_name: str      = Field(..., min_length=2, max_length=150)
    email:          EmailStr
    password:       str      = Field(..., min_length=6, max_length=128)


class AdminLoginRequest(BaseModel):
    login_name: str = Field(..., min_length=1)
    password:   str = Field(..., min_length=1)


class StudentLoginRequest(BaseModel):
    student_code: str = Field(..., min_length=1, max_length=50)
    student_name: str = Field(..., min_length=1, max_length=150)
    institute_id: int = Field(..., gt=0)


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    role:         str
    user_id:      int
    user_name:    str


# ══════════════════════════════════════════════════════════
# ADMIN
# ══════════════════════════════════════════════════════════

class AdminOut(BaseModel):
    id:             int
    login_name:     str
    institute_name: str
    email:          str
    is_active:      bool
    created_at:     datetime

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════
# EXAM
# ══════════════════════════════════════════════════════════

class ExamCreateRequest(BaseModel):
    exam_name:       str   = Field(..., min_length=2, max_length=200)
    num_questions:   int   = Field(..., ge=1, le=500)
    time_limit_mins: int   = Field(..., ge=1, le=300)
    positive_marks:  float = Field(..., ge=0)
    negative_marks:  float = Field(..., ge=0)
    passing_marks:   float = Field(..., ge=0)
    randomize:       bool  = True
    max_attempts:    int   = Field(default=1, ge=1, le=100)


class ExamOut(BaseModel):
    id:              int
    exam_name:       str
    num_questions:   int
    time_limit_mins: int
    positive_marks:  float
    negative_marks:  float
    passing_marks:   float
    is_active:       bool
    randomize:       bool
    max_attempts:    int
    created_at:      datetime

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════
# QUESTION & OPTIONS
# ══════════════════════════════════════════════════════════

class OptionIn(BaseModel):
    option_text:  str  = Field(..., min_length=1)
    is_correct:   bool = False
    option_order: int  = Field(default=1, ge=1, le=4)


class QuestionCreateRequest(BaseModel):
    question_text: str           = Field(..., min_length=5)
    options:       List[OptionIn] = Field(..., min_length=4, max_length=4)

    @model_validator(mode="after")
    def exactly_one_correct(self) -> "QuestionCreateRequest":
        correct_count = sum(1 for o in self.options if o.is_correct)
        if correct_count != 1:
            raise ValueError("Exactly one option must be marked as correct.")
        return self


class OptionOut(BaseModel):
    id:           int
    option_text:  str
    option_order: int

    model_config = {"from_attributes": True}


class OptionOutAdmin(OptionOut):
    is_correct: bool
    model_config = {"from_attributes": True}


class QuestionOut(BaseModel):
    id:            int
    question_text: str
    options:       List[OptionOut]
    model_config = {"from_attributes": True}


class QuestionOutAdmin(BaseModel):
    id:            int
    question_text: str
    options:       List[OptionOutAdmin]
    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════
# STUDENT
# ══════════════════════════════════════════════════════════

class StudentCreateRequest(BaseModel):
    student_code: str = Field(..., min_length=1, max_length=50)
    student_name: str = Field(..., min_length=1, max_length=150)


class StudentOut(BaseModel):
    id:           int
    student_code: str
    student_name: str
    is_active:    bool
    created_at:   datetime
    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════
# EXAM ATTEMPT / SUBMISSION
# ══════════════════════════════════════════════════════════

class ExamStartResponse(BaseModel):
    attempt_id: int
    questions:  List[QuestionOut]


class SingleResponseIn(BaseModel):
    question_id:        int
    selected_option_id: Optional[int] = None


class ExamSubmitRequest(BaseModel):
    attempt_id: int
    responses:  List[SingleResponseIn]


# ══════════════════════════════════════════════════════════
# RESULT
# ══════════════════════════════════════════════════════════

class ResultOut(BaseModel):
    attempt_id:        int
    exam_name:         str
    total_questions:   int
    correct_answers:   int
    incorrect_answers: int
    unattempted:       int
    total_marks:       float
    passing_marks:     float
    is_passed:         bool
    calculated_at:     datetime
    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════
# NEW: ADMIN EXAM RESULTS VIEW
# ══════════════════════════════════════════════════════════

class ExamAttemptResultRow(BaseModel):
    """One row in the admin exam-results table."""
    attempt_id:        int
    student_id:        int
    student_code:      str
    student_name:      str
    started_at:        datetime
    submitted_at:      Optional[datetime]
    correct_answers:   int
    incorrect_answers: int
    unattempted:       int
    total_marks:       float
    passing_marks:     float
    is_passed:         bool


# ══════════════════════════════════════════════════════════
# NEW: STUDENT ATTEMPT HISTORY (for admin student profile)
# ══════════════════════════════════════════════════════════

class StudentAttemptRow(BaseModel):
    """One row in the admin student-profile attempt table."""
    attempt_id:        int
    exam_id:           int
    exam_name:         str
    started_at:        datetime
    submitted_at:      Optional[datetime]
    correct_answers:   int
    incorrect_answers: int
    unattempted:       int
    total_marks:       float
    passing_marks:     float
    is_passed:         bool


class StudentProfileOut(BaseModel):
    student_id:    int
    student_code:  str
    student_name:  str
    total_attempts: int
    average_score: float
    attempts:      List[StudentAttemptRow]


# ══════════════════════════════════════════════════════════
# NEW: ATTEMPT STATUS (student side — retake check)
# ══════════════════════════════════════════════════════════

class AttemptStatusOut(BaseModel):
    attempts_used: int
    max_attempts:  int
    can_attempt:   bool


# ══════════════════════════════════════════════════════════
# NEW: STUDENT STATS
# ══════════════════════════════════════════════════════════

class StudentStatsOut(BaseModel):
    total_attempts: int
    average_score:  float
    exams_passed:   int
    exams_failed:   int
