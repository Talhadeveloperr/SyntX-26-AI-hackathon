-- Quiz schema — execute on syntax26 database

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'quizzes')
BEGIN
    CREATE TABLE quizzes (
        quiz_id           INT PRIMARY KEY IDENTITY(1,1),
        student_id        INT NOT NULL,
        subject_id        INT NOT NULL,
        subject_name      NVARCHAR(255) NOT NULL,
        difficulty        NVARCHAR(50) NOT NULL DEFAULT 'Medium',
        num_questions     INT NOT NULL,
        embeddings_path   NVARCHAR(500) NULL,
        created_at        DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_quizzes_student FOREIGN KEY (student_id) REFERENCES students(student_id),
        CONSTRAINT FK_quizzes_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'quiz_questions')
BEGIN
    CREATE TABLE quiz_questions (
        question_id       INT PRIMARY KEY IDENTITY(1,1),
        quiz_id           INT NOT NULL,
        question_index    INT NOT NULL,
        question_text     NVARCHAR(MAX) NOT NULL,
        options_json      NVARCHAR(MAX) NOT NULL,
        correct_option_id INT NOT NULL,
        created_at        DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_quiz_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'quiz_submissions')
BEGIN
    CREATE TABLE quiz_submissions (
        submission_id     INT PRIMARY KEY IDENTITY(1,1),
        quiz_id           INT NOT NULL,
        student_id        INT NOT NULL,
        score             INT NOT NULL,
        total_questions   INT NOT NULL,
        percentage        DECIMAL(5,2) NOT NULL,
        submitted_at      DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_quiz_submissions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id),
        CONSTRAINT FK_quiz_submissions_student FOREIGN KEY (student_id) REFERENCES students(student_id)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'quiz_submission_answers')
BEGIN
    CREATE TABLE quiz_submission_answers (
        answer_id           INT PRIMARY KEY IDENTITY(1,1),
        submission_id       INT NOT NULL,
        question_id         INT NOT NULL,
        selected_option_id  INT NOT NULL,
        is_correct          BIT NOT NULL,
        CONSTRAINT FK_quiz_sub_answers_submission FOREIGN KEY (submission_id) REFERENCES quiz_submissions(submission_id),
        CONSTRAINT FK_quiz_sub_answers_question FOREIGN KEY (question_id) REFERENCES quiz_questions(question_id)
    );
END
GO
