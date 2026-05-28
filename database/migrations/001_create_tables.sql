-- DriveWise AI — Database Migration
-- Run in order: 001 then 002 (seeds)

CREATE DATABASE IF NOT EXISTS drivewise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE drivewise;

-- ─────────────────────────────────────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    google_id        VARCHAR(128)  NOT NULL UNIQUE,
    email            VARCHAR(255)  NOT NULL UNIQUE,
    name             VARCHAR(255)  NOT NULL,
    avatar           VARCHAR(512)  NULL,
    role             ENUM('admin','instructor','student') NOT NULL DEFAULT 'student',
    whatsapp_number  VARCHAR(30)   NULL,
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- Instructors
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS instructors (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id          INT UNSIGNED NOT NULL UNIQUE,
    bio              TEXT         NULL,
    specialisations  JSON         NULL,
    vehicle_type     VARCHAR(50)  NULL,
    rating           DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- Students
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
    id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id                  INT UNSIGNED NOT NULL UNIQUE,
    test_date                DATE         NULL,
    skill_level              ENUM('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
    learning_pace            ENUM('slow','average','fast') NOT NULL DEFAULT 'average',
    preferred_instructor_id  INT UNSIGNED NULL,
    FOREIGN KEY (user_id)                 REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (preferred_instructor_id) REFERENCES instructors(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- Instructor Availability
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS availability (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    instructor_id  INT UNSIGNED NOT NULL,
    day_of_week    TINYINT UNSIGNED NOT NULL COMMENT '0=Sunday … 6=Saturday',
    start_time     TIME NOT NULL,
    end_time       TIME NOT NULL,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
    INDEX idx_instructor_day (instructor_id, day_of_week)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- Driving Routes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routes (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    topic        VARCHAR(100) NOT NULL,
    waypoints    JSON         NOT NULL,
    geometry     JSON         NULL,
    distance_km  DECIMAL(6,2) NULL,
    created_by   INT UNSIGNED NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_topic (topic)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- Lessons
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id     INT UNSIGNED NOT NULL,
    instructor_id  INT UNSIGNED NOT NULL,
    scheduled_at   DATETIME     NOT NULL,
    duration_mins  SMALLINT UNSIGNED NOT NULL DEFAULT 60,
    topic          VARCHAR(100) NOT NULL,
    status         ENUM('scheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
    route_id       INT UNSIGNED NULL,
    notes          TEXT         NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id)    REFERENCES students(id)    ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
    FOREIGN KEY (route_id)      REFERENCES routes(id)      ON DELETE SET NULL,
    INDEX idx_scheduled  (scheduled_at),
    INDEX idx_student    (student_id),
    INDEX idx_instructor (instructor_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- Lesson Feedback
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_feedback (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lesson_id        INT UNSIGNED NOT NULL UNIQUE,
    instructor_notes TEXT         NULL,
    ai_summary       TEXT         NULL,
    skills_data      JSON         NULL COMMENT 'e.g. {"observation":4,"manoeuvres":3}',
    score            TINYINT UNSIGNED NULL COMMENT '1-10',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- Learning Plans
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_plans (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id          INT UNSIGNED NOT NULL UNIQUE,
    ai_generated_plan   JSON         NOT NULL,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- Notifications
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id  INT UNSIGNED NOT NULL,
    type     VARCHAR(50)  NOT NULL,
    message  TEXT         NOT NULL,
    channel  ENUM('whatsapp','email','sms') NOT NULL DEFAULT 'whatsapp',
    sent_at  DATETIME     NULL,
    read_at  DATETIME     NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_sent (sent_at)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- Sessions (JWT tracking for logout/revocation)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    token_hash  VARCHAR(64)  NOT NULL UNIQUE,
    expires_at  DATETIME     NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token_hash),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB;
