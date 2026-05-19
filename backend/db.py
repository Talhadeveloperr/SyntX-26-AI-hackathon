#!/usr/bin/env python3
import pyodbc
import sys

# ---------------------------
# Database Configuration
# ---------------------------
CONFIG = {
    "server": "localhost",
    "user": "SA",
    "password": "MyStrongP@ss123",
    "database": "syntax26",
    "port": 1433,
    "driver": "ODBC Driver 18 for SQL Server"
}

# ---------------------------
# Paste Your Query Here
# ---------------------------
QUERY = """
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


"""

# ---------------------------
# Execute Query
# ---------------------------
def run_query():
    try:
        connection_string = (
            f"DRIVER={{{CONFIG['driver']}}};"
            f"SERVER={CONFIG['server']},{CONFIG['port']};"
            f"DATABASE={CONFIG['database']};"
            f"UID={CONFIG['user']};"
            f"PWD={CONFIG['password']};"
            f"TrustServerCertificate=yes;"
            f"Encrypt=no;"
        )

        print(f"\n?? Connecting to {CONFIG['server']} ? {CONFIG['database']}...")
        conn = pyodbc.connect(connection_string)
        
        # FIX 1: Enable autocommit so CREATE DATABASE can run without a transaction block
        conn.autocommit = True
        
        cursor = conn.cursor()

        print(f"? Connected!\n")
        print("=" * 60)
        print("?? Running Query:")
        print(QUERY.strip())
        print("=" * 60)

        # Handle multiple statements separated by GO
        statements = [s.strip() for s in QUERY.split("GO") if s.strip()]

        for i, statement in enumerate(statements):
            if not statement:
                continue

            print(f"\n? Executing statement {i+1}...")
            cursor.execute(statement)

            # If it returns rows (SELECT)
            if cursor.description:
                columns = [col[0] for col in cursor.description]
                rows = cursor.fetchall()

                # Print column headers
                col_widths = [max(len(str(col)), 20) for col in columns]
                header = " | ".join(str(col).ljust(col_widths[j]) for j, col in enumerate(columns))
                separator = "-+-".join("-" * w for w in col_widths)

                print(f"\n{header}")
                print(separator)

                for row in rows:
                    print(" | ".join(str(val).ljust(col_widths[j]) for j, val in enumerate(row)))

                print(f"\n({len(rows)} rows returned)")
            else:
                # FIX 2: Only commit if autocommit wasn't explicitly turned on
                if not conn.autocommit:
                    conn.commit()
                print(f"? Statement executed. Rows affected: {cursor.rowcount}")

        cursor.close()
        conn.close()
        print("\n?? Connection closed.")

    except pyodbc.OperationalError as e:
        print(f"\n? Connection Error: {e}")
        print("?? Check: Is MSSQL running? Is the ODBC driver installed?")
        sys.exit(1)
    except pyodbc.ProgrammingError as e:
        print(f"\n? Query Error: {e}")
        sys.exit(1)
    except pyodbc.Error as e:
        print(f"\n? ODBC Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n? Unexpected Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_query()