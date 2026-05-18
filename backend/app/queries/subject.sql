-- ============================================================
-- Subjects schema for Syntax 26
-- Execute on SQL Server (syntax26 database)
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'subjects')
BEGIN
    CREATE TABLE subjects (
        subject_id    INT PRIMARY KEY IDENTITY(1,1),
        student_id    INT NOT NULL,
        subject_name  NVARCHAR(255) NOT NULL,
        folder_name   NVARCHAR(100) NOT NULL,
        created_at    DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at    DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_subjects_student
            FOREIGN KEY (student_id) REFERENCES students(student_id)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'subject_documents')
BEGIN
    CREATE TABLE subject_documents (
        document_id   INT PRIMARY KEY IDENTITY(1,1),
        subject_id    INT NOT NULL,
        student_id    INT NOT NULL,
        file_name     NVARCHAR(255) NOT NULL,
        file_path     NVARCHAR(500) NOT NULL,
        mime_type     NVARCHAR(100) NULL,
        file_size     BIGINT NULL,
        chunk_count   INT NOT NULL DEFAULT 0,
        embedded      BIT NOT NULL DEFAULT 0,
        created_at    DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_subject_documents_subject
            FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
        CONSTRAINT FK_subject_documents_student
            FOREIGN KEY (student_id) REFERENCES students(student_id)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'subject_document_chunks')
BEGIN
    CREATE TABLE subject_document_chunks (
        chunk_id      INT PRIMARY KEY IDENTITY(1,1),
        document_id   INT NOT NULL,
        subject_id    INT NOT NULL,
        chunk_index   INT NOT NULL,
        chunk_text    NVARCHAR(MAX) NOT NULL,
        faiss_id      INT NULL,
        created_at    DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_subject_chunks_document
            FOREIGN KEY (document_id) REFERENCES subject_documents(document_id),
        CONSTRAINT FK_subject_chunks_subject
            FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_subjects_student')
    CREATE INDEX IX_subjects_student ON subjects(student_id, created_at DESC);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_subject_documents_subject')
    CREATE INDEX IX_subject_documents_subject ON subject_documents(subject_id);
GO
