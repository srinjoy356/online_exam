-- ============================================================
-- Online Examination System - MySQL Database Schema
-- Author: System Architect
-- Description: Fully normalized schema with proper indexing
--              and referential integrity constraints.
-- ============================================================

-- Drop database if exists and recreate (for fresh setup)
DROP DATABASE IF EXISTS exam_system;
CREATE DATABASE exam_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE exam_system;

-- ============================================================
-- Table: admins
-- Stores admin (institute) accounts
-- ============================================================
CREATE TABLE admins (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    login_name  VARCHAR(80)  NOT NULL UNIQUE,
    institute_name VARCHAR(150) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,          -- bcrypt hash
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admins_email (email),
    INDEX idx_admins_login (login_name)
) ENGINE=InnoDB;

-- ============================================================
-- Table: exams
-- Each admin can create multiple exams
-- ============================================================
CREATE TABLE exams (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id        INT UNSIGNED NOT NULL,
    exam_name       VARCHAR(200) NOT NULL,
    num_questions   INT UNSIGNED NOT NULL DEFAULT 10,  -- how many Q shown to student
    time_limit_mins INT UNSIGNED NOT NULL DEFAULT 30,  -- exam duration
    positive_marks  DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    negative_marks  DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    passing_marks   DECIMAL(7,2) NOT NULL DEFAULT 40.00,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    randomize       BOOLEAN      NOT NULL DEFAULT TRUE, -- shuffle question order
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    INDEX idx_exams_admin (admin_id),
    INDEX idx_exams_active (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- Table: questions
-- Questions belong to exams
-- ============================================================
CREATE TABLE questions (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    exam_id      INT UNSIGNED NOT NULL,
    question_text TEXT         NOT NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    INDEX idx_questions_exam (exam_id)
) ENGINE=InnoDB;

-- ============================================================
-- Table: options
-- 4 options per question; correct_answer flag on the right one
-- ============================================================
CREATE TABLE options (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question_id   INT UNSIGNED NOT NULL,
    option_text   TEXT         NOT NULL,
    is_correct    BOOLEAN      NOT NULL DEFAULT FALSE,
    option_order  TINYINT      NOT NULL DEFAULT 1,  -- display order 1-4
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_options_question (question_id)
) ENGINE=InnoDB;

-- ============================================================
-- Table: students
-- Students belong to an admin/institute
-- ============================================================
CREATE TABLE students (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id     INT UNSIGNED NOT NULL,            -- which institute they belong to
    student_code VARCHAR(50)  NOT NULL,            -- student login ID (e.g., "STU001")
    student_name VARCHAR(150) NOT NULL,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    UNIQUE KEY uq_student_code_admin (student_code, admin_id),  -- code unique per institute
    INDEX idx_students_admin (admin_id),
    INDEX idx_students_code (student_code)
) ENGINE=InnoDB;

-- ============================================================
-- Table: exam_attempts
-- Tracks each time a student starts an exam session
-- ============================================================
CREATE TABLE exam_attempts (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id   INT UNSIGNED NOT NULL,
    exam_id      INT UNSIGNED NOT NULL,
    started_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at DATETIME     NULL,                -- NULL = still in progress
    is_completed BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Stores the ordered list of question IDs shown to this student (JSON array)
    question_order JSON        NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id)    REFERENCES exams(id)    ON DELETE CASCADE,
    INDEX idx_attempt_student (student_id),
    INDEX idx_attempt_exam    (exam_id),
    INDEX idx_attempt_completed (is_completed)
) ENGINE=InnoDB;

-- ============================================================
-- Table: responses
-- One row per question answered in an attempt
-- ============================================================
CREATE TABLE responses (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attempt_id   INT UNSIGNED NOT NULL,
    question_id  INT UNSIGNED NOT NULL,
    selected_option_id INT UNSIGNED NULL,          -- NULL = unattempted
    answered_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id)          REFERENCES exam_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id)         REFERENCES questions(id)     ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id)  REFERENCES options(id)       ON DELETE SET NULL,
    UNIQUE KEY uq_response (attempt_id, question_id),   -- one response per Q per attempt
    INDEX idx_responses_attempt (attempt_id)
) ENGINE=InnoDB;

-- ============================================================
-- Table: results
-- Computed once on submission; stores final score breakdown
-- ============================================================
CREATE TABLE results (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attempt_id           INT UNSIGNED NOT NULL UNIQUE,  -- one result per attempt
    correct_answers      INT UNSIGNED NOT NULL DEFAULT 0,
    incorrect_answers    INT UNSIGNED NOT NULL DEFAULT 0,
    unattempted          INT UNSIGNED NOT NULL DEFAULT 0,
    total_marks          DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    passing_marks        DECIMAL(8,2) NOT NULL,         -- snapshot at time of exam
    is_passed            BOOLEAN      NOT NULL DEFAULT FALSE,
    calculated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE,
    INDEX idx_results_attempt (attempt_id)
) ENGINE=InnoDB;

-- ============================================================
-- Seed data: demo admin account (password: Admin@123)
-- Run: python -c "import bcrypt; print(bcrypt.hashpw(b'Admin@123', bcrypt.gensalt()).decode())"
-- ============================================================
INSERT INTO admins (login_name, institute_name, email, password_hash) VALUES
('demo_admin', 'Demo Institute', 'admin@demo.com',
 '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW');
-- Note: Replace hash above with a freshly generated one in production!
