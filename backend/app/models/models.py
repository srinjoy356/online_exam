"""
app/models/models.py
--------------------
SQLAlchemy ORM models mirroring the MySQL schema.
Relationships are defined here to allow easy navigation between entities.
"""
from __future__ import annotations
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey,
    Integer, Numeric, String, Text,
    UniqueConstraint, JSON, func,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.db.session import Base


class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[int]             = mapped_column(Integer, primary_key=True, autoincrement=True)
    login_name: Mapped[str]     = mapped_column(String(80),  nullable=False, unique=True, index=True)
    institute_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str]          = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str]  = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool]     = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime]= mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime]= mapped_column(DateTime, server_default=func.now(),
                                                 onupdate=func.now(), nullable=False)

    # Relationships
    exams:    Mapped[List["Exam"]]    = relationship("Exam",    back_populates="admin", cascade="all, delete-orphan")
    students: Mapped[List["Student"]] = relationship("Student", back_populates="admin", cascade="all, delete-orphan")


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[int]              = mapped_column(Integer, primary_key=True, autoincrement=True)
    admin_id: Mapped[int]        = mapped_column(Integer, ForeignKey("admins.id", ondelete="CASCADE"), nullable=False, index=True)
    exam_name: Mapped[str]       = mapped_column(String(200), nullable=False)
    num_questions: Mapped[int]   = mapped_column(Integer, default=10, nullable=False)
    time_limit_mins: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    positive_marks: Mapped[float]= mapped_column(Numeric(5, 2), default=1.00, nullable=False)
    negative_marks: Mapped[float]= mapped_column(Numeric(5, 2), default=0.00, nullable=False)
    passing_marks: Mapped[float] = mapped_column(Numeric(7, 2), default=40.00, nullable=False)
    is_active: Mapped[bool]      = mapped_column(Boolean, default=True, nullable=False, index=True)
    randomize: Mapped[bool]      = mapped_column(Boolean, default=True, nullable=False)
    max_attempts: Mapped[int]    = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(),
                                                  onupdate=func.now(), nullable=False)

    # Relationships
    admin:     Mapped["Admin"]          = relationship("Admin",    back_populates="exams")
    questions: Mapped[List["Question"]] = relationship("Question", back_populates="exam", cascade="all, delete-orphan")
    attempts:  Mapped[List["ExamAttempt"]] = relationship("ExamAttempt", back_populates="exam")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int]            = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[int]       = mapped_column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime]= mapped_column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    exam:      Mapped["Exam"]       = relationship("Exam",    back_populates="questions")
    options:   Mapped[List["Option"]] = relationship("Option", back_populates="question",
                                                      cascade="all, delete-orphan",
                                                      order_by="Option.option_order")
    responses: Mapped[List["Response"]] = relationship("Response", back_populates="question")


class Option(Base):
    __tablename__ = "options"

    id: Mapped[int]           = mapped_column(Integer, primary_key=True, autoincrement=True)
    question_id: Mapped[int]  = mapped_column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    option_text: Mapped[str]  = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool]  = mapped_column(Boolean, default=False, nullable=False)
    option_order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    question: Mapped["Question"] = relationship("Question", back_populates="options")


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int]            = mapped_column(Integer, primary_key=True, autoincrement=True)
    admin_id: Mapped[int]      = mapped_column(Integer, ForeignKey("admins.id", ondelete="CASCADE"), nullable=False, index=True)
    student_code: Mapped[str]  = mapped_column(String(50), nullable=False, index=True)
    student_name: Mapped[str]  = mapped_column(String(150), nullable=False)
    is_active: Mapped[bool]    = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime]= mapped_column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("student_code", "admin_id", name="uq_student_code_admin"),
    )

    # Relationships
    admin:    Mapped["Admin"]           = relationship("Admin",       back_populates="students")
    attempts: Mapped[List["ExamAttempt"]] = relationship("ExamAttempt", back_populates="student")


class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id: Mapped[int]              = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int]      = mapped_column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    exam_id: Mapped[int]         = mapped_column(Integer, ForeignKey("exams.id",    ondelete="CASCADE"), nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_completed: Mapped[bool]   = mapped_column(Boolean, default=False, nullable=False, index=True)
    question_order: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # list of question IDs

    # Relationships
    student:   Mapped["Student"]        = relationship("Student",  back_populates="attempts")
    exam:      Mapped["Exam"]           = relationship("Exam",     back_populates="attempts")
    responses: Mapped[List["Response"]] = relationship("Response", back_populates="attempt",  cascade="all, delete-orphan")
    result:    Mapped[Optional["Result"]] = relationship("Result", back_populates="attempt",  uselist=False)


class Response(Base):
    __tablename__ = "responses"

    id: Mapped[int]                = mapped_column(Integer, primary_key=True, autoincrement=True)
    attempt_id: Mapped[int]        = mapped_column(Integer, ForeignKey("exam_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id: Mapped[int]       = mapped_column(Integer, ForeignKey("questions.id",     ondelete="CASCADE"), nullable=False)
    selected_option_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("options.id", ondelete="SET NULL"), nullable=True)
    answered_at: Mapped[datetime]  = mapped_column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("attempt_id", "question_id", name="uq_response"),
    )

    # Relationships
    attempt:  Mapped["ExamAttempt"]   = relationship("ExamAttempt", back_populates="responses")
    question: Mapped["Question"]      = relationship("Question",    back_populates="responses")
    selected_option: Mapped[Optional["Option"]] = relationship("Option")


class Result(Base):
    __tablename__ = "results"

    id: Mapped[int]                = mapped_column(Integer, primary_key=True, autoincrement=True)
    attempt_id: Mapped[int]        = mapped_column(Integer, ForeignKey("exam_attempts.id", ondelete="CASCADE"),
                                                    nullable=False, unique=True, index=True)
    correct_answers: Mapped[int]   = mapped_column(Integer, default=0, nullable=False)
    incorrect_answers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    unattempted: Mapped[int]       = mapped_column(Integer, default=0, nullable=False)
    total_marks: Mapped[float]     = mapped_column(Numeric(8, 2), default=0.00, nullable=False)
    passing_marks: Mapped[float]   = mapped_column(Numeric(8, 2), nullable=False)
    is_passed: Mapped[bool]        = mapped_column(Boolean, default=False, nullable=False)
    calculated_at: Mapped[datetime]= mapped_column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    attempt: Mapped["ExamAttempt"] = relationship("ExamAttempt", back_populates="result")
