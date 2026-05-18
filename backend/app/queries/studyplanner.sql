-- ============================================================
-- Study Planner Tables
-- Run this script once in the syntax26 database
-- ============================================================

-- Table 1: Study Deadlines
CREATE TABLE study_deadlines (
    deadline_id    INT PRIMARY KEY IDENTITY(1,1),
    student_id     INT NOT NULL,
    subject_name   NVARCHAR(150) NOT NULL,
    description    NVARCHAR(500) NULL,
    deadline_date  DATE NOT NULL,
    priority       NVARCHAR(20) NOT NULL DEFAULT 'Medium',   -- High | Medium | Low
    status         NVARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | completed
    created_at     DATETIME DEFAULT GETDATE(),
    updated_at     DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_dl_student FOREIGN KEY (student_id)
        REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE INDEX idx_deadlines_student   ON study_deadlines(student_id);
CREATE INDEX idx_deadlines_date      ON study_deadlines(deadline_date);

-- Table 2: Study Sessions  (tracks logged focus time)
CREATE TABLE study_sessions (
    session_id       INT PRIMARY KEY IDENTITY(1,1),
    student_id       INT NOT NULL,
    subject_name     NVARCHAR(150) NOT NULL,
    session_date     DATE NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    notes            NVARCHAR(500) NULL,
    created_at       DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_sess_student FOREIGN KEY (student_id)
        REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_student    ON study_sessions(student_id);
CREATE INDEX idx_sessions_date       ON study_sessions(session_date);
