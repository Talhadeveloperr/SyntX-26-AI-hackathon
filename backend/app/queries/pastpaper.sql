-- d:\projects\syntax 26\backend\app\queries\pastpaper.sql

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'pastpaper_analyses')
BEGIN
    CREATE TABLE pastpaper_analyses (
        analysis_id     INT PRIMARY KEY IDENTITY(1,1),
        student_id      INT NOT NULL,
        subject_id      INT NOT NULL,
        subject_name    NVARCHAR(255) NOT NULL,
        paper_name      NVARCHAR(255) NOT NULL,
        file_path       NVARCHAR(500) NULL,
        analyzed_at     DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_pastpaper_analyses_student FOREIGN KEY (student_id) REFERENCES students(student_id),
        CONSTRAINT FK_pastpaper_analyses_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'predicted_questions')
BEGIN
    CREATE TABLE predicted_questions (
        prediction_id   INT PRIMARY KEY IDENTITY(1,1),
        analysis_id     INT NOT NULL,
        question_text   NVARCHAR(MAX) NOT NULL,
        total_marks     INT NOT NULL DEFAULT 5,
        confidence      DECIMAL(5,2) NOT NULL DEFAULT 0.0, -- Confidence percentage (e.g., 85.50 for 85.5%)
        topic           NVARCHAR(255) NOT NULL,
        created_at      DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_predicted_questions_analysis FOREIGN KEY (analysis_id) REFERENCES pastpaper_analyses(analysis_id) ON DELETE CASCADE
    );
END
GO
