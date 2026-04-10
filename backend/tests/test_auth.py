"""
tests/test_auth.py
------------------
Basic smoke tests for auth endpoints.
Run with:  pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import Base, get_db

# ── In-memory SQLite for tests (no MySQL needed) ──────────
SQLITE_URL = "sqlite:///./test.db"
engine_test = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(bind=engine_test, autocommit=False, autoflush=False)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Create tables in test DB
Base.metadata.create_all(bind=engine_test)

client = TestClient(app)


# ── Fixtures ──────────────────────────────────────────────
ADMIN_PAYLOAD = {
    "login_name": "test_admin",
    "institute_name": "Test Institute",
    "email": "testadmin@example.com",
    "password": "password123",
}


@pytest.fixture(scope="module")
def admin_token():
    """Register an admin and return their JWT."""
    client.post("/api/v1/auth/admin/register", json=ADMIN_PAYLOAD)
    resp = client.post("/api/v1/auth/admin/login", json={
        "login_name": ADMIN_PAYLOAD["login_name"],
        "password":   ADMIN_PAYLOAD["password"],
    })
    return resp.json()["access_token"]


# ── Tests ─────────────────────────────────────────────────

def test_admin_register():
    # Second registration with same login should fail (409)
    r = client.post("/api/v1/auth/admin/register", json=ADMIN_PAYLOAD)
    # Either 201 (first run) or 409 (duplicate)
    assert r.status_code in (201, 409)


def test_admin_login_success():
    r = client.post("/api/v1/auth/admin/login", json={
        "login_name": ADMIN_PAYLOAD["login_name"],
        "password":   ADMIN_PAYLOAD["password"],
    })
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["role"] == "admin"


def test_admin_login_wrong_password():
    r = client.post("/api/v1/auth/admin/login", json={
        "login_name": ADMIN_PAYLOAD["login_name"],
        "password":   "wrong_password",
    })
    assert r.status_code == 401


def test_protected_route_without_token():
    r = client.get("/api/v1/admin/exams")
    assert r.status_code == 403   # HTTPBearer returns 403 when no token


def test_create_exam(admin_token):
    r = client.post(
        "/api/v1/admin/exams",
        json={
            "exam_name": "Sample Exam",
            "num_questions": 5,
            "time_limit_mins": 30,
            "positive_marks": 1,
            "negative_marks": 0.25,
            "passing_marks": 3,
            "randomize": True,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 201
    assert r.json()["exam_name"] == "Sample Exam"


def test_add_question(admin_token):
    # First create an exam
    exam_r = client.post(
        "/api/v1/admin/exams",
        json={"exam_name":"Q Test","num_questions":1,"time_limit_mins":10,
              "positive_marks":1,"negative_marks":0,"passing_marks":1},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    exam_id = exam_r.json()["id"]

    q_r = client.post(
        f"/api/v1/admin/exams/{exam_id}/questions",
        json={
            "question_text": "What is 2 + 2?",
            "options": [
                {"option_text": "3",  "is_correct": False, "option_order": 1},
                {"option_text": "4",  "is_correct": True,  "option_order": 2},
                {"option_text": "5",  "is_correct": False, "option_order": 3},
                {"option_text": "22", "is_correct": False, "option_order": 4},
            ],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert q_r.status_code == 201
    assert q_r.json()["question_text"] == "What is 2 + 2?"


def test_student_login_invalid():
    r = client.post("/api/v1/auth/student/login", json={
        "student_code": "FAKE001",
        "student_name": "Nobody",
        "institute_id": 9999,
    })
    assert r.status_code == 401
