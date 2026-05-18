CREATE TABLE students (
    student_id INT PRIMARY KEY IDENTITY(1,1),

    full_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(150) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,

    class_level NVARCHAR(50),
    institution_name NVARCHAR(150),

    city NVARCHAR(100),
    age INT,

    role NVARCHAR(20) DEFAULT 'student',

    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);