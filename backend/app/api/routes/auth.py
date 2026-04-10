"""
app/api/routes/auth.py
----------------------
Public authentication endpoints (no JWT required).
  POST /auth/admin/register  – create a new admin account
  POST /auth/admin/login     – returns JWT for admin
  POST /auth/student/login   – returns JWT for student
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.session import get_db
from app.models.models import Admin, Student
from app.schemas.schemas import (
    AdminRegisterRequest, AdminLoginRequest,
    StudentLoginRequest, TokenResponse,
)
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Admin: Register ───────────────────────────────────────
@router.post(
    "/admin/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def admin_register(payload: AdminRegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new admin (institute owner).
    Hashes password with bcrypt before persisting.
    """
    new_admin = Admin(
        login_name=payload.login_name,
        institute_name=payload.institute_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(new_admin)
    try:
        db.commit()
        db.refresh(new_admin)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="login_name or email already exists.",
        )

    token = create_access_token(subject=new_admin.id, role="admin")
    return TokenResponse(
        access_token=token,
        role="admin",
        user_id=new_admin.id,
        user_name=new_admin.login_name,
    )


# ── Admin: Login ──────────────────────────────────────────
@router.post("/admin/login", response_model=TokenResponse)
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate an admin by login_name + password.
    Returns a JWT on success.
    """
    admin: Admin | None = (
        db.query(Admin).filter(Admin.login_name == payload.login_name).first()
    )
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )
    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Account is deactivated.")

    token = create_access_token(subject=admin.id, role="admin")
    return TokenResponse(
        access_token=token,
        role="admin",
        user_id=admin.id,
        user_name=admin.login_name,
    )


# ── Student: Login ────────────────────────────────────────
@router.post("/student/login", response_model=TokenResponse)
def student_login(payload: StudentLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a student by student_code + student_name + institute_id.
    All three must match the same record in the database.
    """
    student: Student | None = (
        db.query(Student)
        .filter(
            Student.student_code == payload.student_code,
            Student.student_name == payload.student_name,
            Student.admin_id    == payload.institute_id,
            Student.is_active   == True,
        )
        .first()
    )
    if not student:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid student credentials or institute ID.",
        )

    token = create_access_token(subject=student.id, role="student")
    return TokenResponse(
        access_token=token,
        role="student",
        user_id=student.id,
        user_name=student.student_name,
    )
