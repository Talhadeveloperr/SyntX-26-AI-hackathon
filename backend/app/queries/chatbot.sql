-- ============================================================
-- Chatbot schema for Syntax 26
-- Execute these statements on your SQL Server (syntax26 DB)
-- ============================================================

-- Chat sessions (one row per "New Chat" in the dashboard)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'chat_sessions')
BEGIN
    CREATE TABLE chat_sessions (
        session_id   INT PRIMARY KEY IDENTITY(1,1),
        student_id   INT NOT NULL,
        title        NVARCHAR(255) NOT NULL DEFAULT N'New Chat',
        created_at   DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at   DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_chat_sessions_student
            FOREIGN KEY (student_id) REFERENCES students(student_id)
    );
END
GO

-- Uploaded files metadata (paths under backend/Chat_documents)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'chat_documents')
BEGIN
    CREATE TABLE chat_documents (
        document_id  INT PRIMARY KEY IDENTITY(1,1),
        session_id   INT NOT NULL,
        student_id   INT NOT NULL,
        file_name    NVARCHAR(255) NOT NULL,
        file_path    NVARCHAR(500) NOT NULL,
        file_type    NVARCHAR(50) NOT NULL,   -- image | document | file
        mime_type    NVARCHAR(100) NULL,
        file_size    BIGINT NULL,
        chunk_count  INT NOT NULL DEFAULT 0,
        embedded     BIT NOT NULL DEFAULT 0,
        created_at   DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_chat_documents_session
            FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id),
        CONSTRAINT FK_chat_documents_student
            FOREIGN KEY (student_id) REFERENCES students(student_id)
    );
END
GO

-- Text chunks linked to documents (vectors live in FAISS on disk)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'chat_document_chunks')
BEGIN
    CREATE TABLE chat_document_chunks (
        chunk_id      INT PRIMARY KEY IDENTITY(1,1),
        document_id   INT NOT NULL,
        session_id    INT NOT NULL,
        chunk_index   INT NOT NULL,
        chunk_text    NVARCHAR(MAX) NOT NULL,
        faiss_id      INT NULL,
        created_at    DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_chat_chunks_document
            FOREIGN KEY (document_id) REFERENCES chat_documents(document_id),
        CONSTRAINT FK_chat_chunks_session
            FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id)
    );
END
GO

-- Conversation history
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'chat_messages')
BEGIN
    CREATE TABLE chat_messages (
        message_id   INT PRIMARY KEY IDENTITY(1,1),
        session_id   INT NOT NULL,
        role         NVARCHAR(20) NOT NULL,   -- user | assistant
        content      NVARCHAR(MAX) NOT NULL,
        created_at   DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_chat_messages_session
            FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id),
        CONSTRAINT CHK_chat_messages_role
            CHECK (role IN ('user', 'assistant'))
    );
END
GO

-- Helpful indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_chat_sessions_student')
    CREATE INDEX IX_chat_sessions_student ON chat_sessions(student_id, updated_at DESC);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_chat_messages_session')
    CREATE INDEX IX_chat_messages_session ON chat_messages(session_id, created_at ASC);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_chat_documents_session')
    CREATE INDEX IX_chat_documents_session ON chat_documents(session_id);
GO
