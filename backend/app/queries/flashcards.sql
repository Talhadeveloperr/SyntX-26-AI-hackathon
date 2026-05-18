-- ============================================================
-- Flashcards Tables
-- Run this script once in the syntax26 database
-- ============================================================

-- Table 1: Flashcard Decks
CREATE TABLE flashcard_decks (
    deck_id    INT PRIMARY KEY IDENTITY(1,1),
    student_id INT NOT NULL,
    name       NVARCHAR(100) NOT NULL,
    icon       NVARCHAR(50)  NOT NULL DEFAULT 'style',
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_fdecks_student FOREIGN KEY (student_id)
        REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE INDEX idx_fdecks_student ON flashcard_decks(student_id);

-- Table 2: Flashcards  (spaced-repetition fields included)
CREATE TABLE flashcards (
    card_id        INT PRIMARY KEY IDENTITY(1,1),
    deck_id        INT NOT NULL,
    student_id     INT NOT NULL,
    front_text     NVARCHAR(1000) NOT NULL,
    back_text      NVARCHAR(2000) NOT NULL,
    interval_days  INT   NOT NULL DEFAULT 1,
    ease_factor    FLOAT NOT NULL DEFAULT 2.5,
    next_review    DATE  NOT NULL DEFAULT (CAST(GETDATE() AS DATE)),
    last_reviewed  DATETIME NULL,
    review_count   INT   NOT NULL DEFAULT 0,
    created_at     DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_fc_deck FOREIGN KEY (deck_id)
        REFERENCES flashcard_decks(deck_id) ON DELETE CASCADE
);

CREATE INDEX idx_fc_deck    ON flashcards(deck_id);
CREATE INDEX idx_fc_student ON flashcards(student_id);
CREATE INDEX idx_fc_review  ON flashcards(student_id, next_review);
