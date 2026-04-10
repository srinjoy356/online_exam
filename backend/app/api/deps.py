"""
app/api/deps.py
---------------
FastAPI dependencies for:
  • Extracting the current user from the Authorization header
  • Role-based access control (RBAC) guards
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.models import Admin, Student

# Bearer token extractor (reads Authorization: Bearer <token>)
bearer_scheme = HTTPBearer()


def _get_token_payload(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Decode and validate the JWT; raise 401 on failure."""
    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def get_current_admin(
    payload: dict = Depends(_get_token_payload),
    db: Session = Depends(get_db),
) -> Admin:
    """
    Dependency: resolves to the authenticated Admin ORM object.
    Raises 403 if the token belongs to a student.
    """
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Admin access required.")
    admin_id = int(payload["sub"])
    admin = db.get(Admin, admin_id)
    if not admin or not admin.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Admin account not found or inactive.")
    return admin


def get_current_student(
    payload: dict = Depends(_get_token_payload),
    db: Session = Depends(get_db),
) -> Student:
    """
    Dependency: resolves to the authenticated Student ORM object.
    Raises 403 if the token belongs to an admin.
    """
    if payload.get("role") != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Student access required.")
    student_id = int(payload["sub"])
    student = db.get(Student, student_id)
    if not student or not student.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Student account not found or inactive.")
    return student
