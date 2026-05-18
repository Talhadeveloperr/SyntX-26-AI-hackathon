-- Flashcard schema — execute on syntax26 database
-- Only the two tables needed for flashcard generation and retrieval

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'flashcard_sets')
BEGIN
    CREATE TABLE flashcard_sets (
        set_id          INT PRIMARY KEY IDENTITY(1,1),
        student_id      INT NOT NULL,
        subject_id      INT NOT NULL,
        subject_name    NVARCHAR(255) NOT NULL,
        num_cards       INT NOT NULL,
        embeddings_path NVARCHAR(500) NULL,
        created_at      DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_flashcard_sets_student FOREIGN KEY (student_id) REFERENCES students(student_id),
        CONSTRAINT FK_flashcard_sets_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'flashcards')
BEGIN
    CREATE TABLE flashcards (
        flashcard_id    INT PRIMARY KEY IDENTITY(1,1),
        set_id          INT NOT NULL,
        card_index      INT NOT NULL,
        question        NVARCHAR(MAX) NOT NULL,
        answer          NVARCHAR(MAX) NOT NULL,
        created_at      DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_flashcards_set FOREIGN KEY (set_id) REFERENCES flashcard_sets(set_id)
    );
END
GO
