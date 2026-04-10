# 📚 Online Examination System — Complete Setup Guide

> **Stack:** FastAPI (Python) · React.js (Node.js) · MySQL · JWT Auth

---

## 📁 Project Structure

```
exam-system/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py            # JWT auth dependencies / RBAC
│   │   │   └── routes/
│   │   │       ├── auth.py        # Register & login endpoints
│   │   │       ├── admin.py       # Admin-only endpoints
│   │   │       └── student.py     # Student-only endpoints
│   │   ├── core/
│   │   │   ├── config.py          # Settings from .env
│   │   │   └── security.py        # JWT + bcrypt helpers
│   │   ├── db/
│   │   │   └── session.py         # SQLAlchemy engine + get_db()
│   │   ├── models/
│   │   │   └── models.py          # All ORM models
│   │   ├── schemas/
│   │   │   └── schemas.py         # Pydantic request/response schemas
│   │   └── main.py                # FastAPI app factory + routers
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js          # Axios instance + interceptors
│   │   │   └── services.js        # All API call functions
│   │   ├── components/
│   │   │   └── common/
│   │   │       └── Navbar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # JWT session state
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminLogin.jsx
│   │   │   │   ├── AdminRegister.jsx
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── ExamCreate.jsx
│   │   │   │   ├── ExamDetail.jsx     # Add/view/delete questions
│   │   │   │   └── StudentManage.jsx
│   │   │   └── student/
│   │   │       ├── StudentLogin.jsx
│   │   │       ├── ExamList.jsx
│   │   │       ├── ExamInterface.jsx  # Timed exam UI
│   │   │       └── ResultScreen.jsx
│   │   ├── App.jsx                # Route definitions
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── database/
    └── schema.sql                 # Full MySQL schema with seed data
```

---

## 🗄️ Step 1 — Database Setup

### Prerequisites
- MySQL 8.0+ running locally or remotely.

### Run the schema

```bash
mysql -u root -p < database/schema.sql
```

This creates the `exam_system` database with all 7 tables:

| Table | Description |
|---|---|
| `admins` | Institute admin accounts |
| `exams` | Exam configurations |
| `questions` | Questions per exam |
| `options` | 4 options per question |
| `students` | Students per institute |
| `exam_attempts` | Each time a student starts an exam |
| `responses` | Per-question answers for an attempt |
| `results` | Computed score after submission |

---

## ⚙️ Step 2 — Backend Setup (Python / FastAPI)

### 2.1 Prerequisites
- Python 3.11+
- pip

### 2.2 Create virtual environment

```bash
cd backend
python -m venv venv

# Activate:
# macOS / Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### 2.3 Install dependencies

```bash
pip install -r requirements.txt
```

### 2.4 Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=exam_system
DB_USER=root
DB_PASSWORD=your_mysql_password

# Generate a strong secret:
# python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=your_64_char_random_hex_string
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

APP_ENV=development
APP_PORT=8000
CORS_ORIGINS=http://localhost:3000
```

### 2.5 Start the backend

```bash
# From the backend/ directory:
python -m app.main

# OR with uvicorn directly:
uvicorn app.main:app --reload --port 8000
```

The API will be live at:
- **API Base:** `http://localhost:8000/api/v1`
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **Health check:** `http://localhost:8000/health`

---

## 🌐 Step 3 — Frontend Setup (React / Node.js)

### 3.1 Prerequisites
- Node.js 18+
- npm

### 3.2 Install dependencies

```bash
cd frontend
npm install
```

### 3.3 Start the dev server

```bash
npm run dev
```

Frontend runs at: `http://localhost:3000`

The Vite dev server automatically proxies `/api` requests to `http://localhost:8000`, so no CORS issues during development.

### 3.4 Build for production

```bash
npm run build
# Output goes to frontend/dist/
```

---

## 🚀 Step 4 — Using the System

### Admin Flow

1. **Register** at `http://localhost:3000/admin/register`
   - Note your **Admin ID** (shown in the Students page header) — students need it to log in.

2. **Create an Exam**
   - Go to Dashboard → New Exam
   - Set name, question count, time limit, and marking scheme

3. **Add Questions**
   - Click "Manage" on an exam → Add Question
   - Fill question text + 4 options, mark one correct

4. **Add Students**
   - Go to Students page → Add student with a unique code + name

### Student Flow

1. **Login** at `http://localhost:3000/student/login`
   - Enter Institute ID (admin's user ID), Student Code, and Full Name

2. **Take an Exam**
   - Select an exam from the list
   - Navigate questions with Next/Previous or the question palette
   - Timer counts down and auto-submits on expiry

3. **View Result**
   - After submit (or auto-submit), the result screen shows:
     - Correct / Incorrect / Skipped counts
     - Total marks and Pass/Fail status

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/admin/register` | Register admin |
| POST | `/api/v1/auth/admin/login` | Admin login → JWT |
| POST | `/api/v1/auth/student/login` | Student login → JWT |

### Admin Endpoints (Bearer token required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/exams` | Create exam |
| GET | `/api/v1/admin/exams` | List exams |
| GET | `/api/v1/admin/exams/{id}` | Exam detail with questions |
| DELETE | `/api/v1/admin/exams/{id}` | Deactivate exam |
| POST | `/api/v1/admin/exams/{id}/questions` | Add question |
| DELETE | `/api/v1/admin/exams/{id}/questions/{qid}` | Delete question |
| POST | `/api/v1/admin/students` | Add student |
| GET | `/api/v1/admin/students` | List students |
| DELETE | `/api/v1/admin/students/{id}` | Remove student |

### Student Endpoints (Bearer token required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/student/exams` | List available exams |
| POST | `/api/v1/student/exams/{id}/start` | Start / resume attempt |
| POST | `/api/v1/student/exams/submit` | Submit responses |
| GET | `/api/v1/student/results/{attempt_id}` | View result |

### Example API Calls (curl)

```bash
# Register admin
curl -X POST http://localhost:8000/api/v1/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{"login_name":"admin1","institute_name":"My School","email":"a@b.com","password":"secret123"}'

# Login and save token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"login_name":"admin1","password":"secret123"}' | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Create exam
curl -X POST http://localhost:8000/api/v1/admin/exams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"exam_name":"Math Test","num_questions":5,"time_limit_mins":15,"positive_marks":2,"negative_marks":0.5,"passing_marks":6}'
```

---

## 🔐 Security Notes

| Feature | Implementation |
|---|---|
| Password hashing | bcrypt (cost factor 12) via passlib |
| Authentication | JWT (HS256), 60-minute expiry |
| RBAC | `role` claim in JWT; server-side validation on every request |
| SQL injection | Prevented via SQLAlchemy ORM (parameterised queries) |
| Input validation | Pydantic v2 schemas with strict types and constraints |
| Correct answers | Never sent to the student frontend |
| CORS | Configured to allow only the frontend origin |

---

## 🧪 Running Tests

```bash
cd backend
pip install pytest httpx
pytest tests/ -v
```

---

## 🐳 Docker Quick Start (Optional)

Create `docker-compose.yml` in the project root:

```yaml
version: "3.9"
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: exam_system
    ports: ["3306:3306"]
    volumes:
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      DB_HOST: db
      DB_PASSWORD: rootpass
      JWT_SECRET_KEY: change_me_in_production
      CORS_ORIGINS: http://localhost:3000
    depends_on: [db]

  frontend:
    build: ./frontend
    ports: ["3000:80"]
    depends_on: [backend]
```

---

## 🏗️ Production Checklist

- [ ] Generate a strong `JWT_SECRET_KEY` (32+ random bytes)
- [ ] Set `APP_ENV=production` in backend `.env`
- [ ] Use a dedicated MySQL user with minimal privileges (not root)
- [ ] Enable HTTPS (nginx + certbot recommended)
- [ ] Update `CORS_ORIGINS` to your production domain
- [ ] Build frontend: `npm run build`, serve `dist/` via nginx
- [ ] Run backend with: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4`
- [ ] Set up database backups

---

## 📊 Database Schema (ERD Summary)

```
admins (1) ──< exams (1) ──< questions (1) ──< options
  │
  └──< students (1) ──< exam_attempts (1) ──< responses
                               │
                               └── results (1:1)
```

All foreign keys use `ON DELETE CASCADE` so deleting an admin cleans up all their data automatically.

---

## 💡 Bonus Features to Add

| Feature | How |
|---|---|
| 🏆 Leaderboard | Add `/admin/exams/{id}/leaderboard` — query results ordered by `total_marks DESC` |
| 📧 Email notifications | Use `fastapi-mail` + SMTP; trigger after result calculation |
| 📊 Analytics | Aggregate `results` table per exam to compute avg score, pass rate |
| 🔒 Exam password | Add `exam_password` column; validate on start |
| 📱 Mobile app | Use the same FastAPI backend — just consume the JWT API from React Native |
