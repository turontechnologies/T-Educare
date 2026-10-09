IF OBJECT_ID(N'dbo.students', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.students (
        id NVARCHAR(64) PRIMARY KEY,
        institution_id NVARCHAR(64) NOT NULL,
        matric_no NVARCHAR(50) NOT NULL,
        title NVARCHAR(20) NOT NULL,
        first_name NVARCHAR(100) NOT NULL,
        middle_name NVARCHAR(100) NULL,
        last_name NVARCHAR(100) NOT NULL,
        other_name NVARCHAR(100) NULL,
        gender NVARCHAR(20) NOT NULL,
        marital_status NVARCHAR(20) NOT NULL,
        email NVARCHAR(150) NOT NULL,
        phone NVARCHAR(30) NOT NULL,
        emergency_contact NVARCHAR(150) NOT NULL,
        date_of_birth DATETIME2 NOT NULL,
        religion NVARCHAR(20) NOT NULL,
        maiden_name NVARCHAR(100) NULL,
        blood_group NVARCHAR(5) NOT NULL,
        genotype NVARCHAR(5) NOT NULL,
        weight_kg FLOAT NOT NULL,
        height_cm FLOAT NOT NULL,
        nationality NVARCHAR(100) NOT NULL,
        state_of_origin NVARCHAR(100) NOT NULL,
        lga NVARCHAR(100) NOT NULL,
        resident_address NVARCHAR(500) NOT NULL,
        avatar_url NVARCHAR(500) NULL,
        school_id NVARCHAR(64) NOT NULL,
        faculty_id NVARCHAR(64) NOT NULL,
        department_id NVARCHAR(64) NOT NULL,
        program_id NVARCHAR(64) NOT NULL,
        program_level_id NVARCHAR(64) NOT NULL,
        current_session_id NVARCHAR(64) NOT NULL,
        status NVARCHAR(20) NOT NULL,
        is_graduating BIT NOT NULL,
        is_deferred BIT NOT NULL,
        hold_for_review BIT NOT NULL,
        allergies NVARCHAR(1000) NULL,
        chronic_conditions NVARCHAR(1000) NULL,
        current_medications NVARCHAR(1000) NULL,
        past_surgeries NVARCHAR(1000) NULL,
        physician_name NVARCHAR(150) NULL,
        physician_phone NVARCHAR(30) NULL,
        health_insurance_provider NVARCHAR(150) NULL,
        health_insurance_number NVARCHAR(100) NULL,
        medical_notes NVARCHAR(2000) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        archived_at DATETIME2 NULL
    );

    CREATE INDEX IX_students_institution ON dbo.students(institution_id);
    CREATE INDEX IX_students_school ON dbo.students(school_id);
    CREATE INDEX IX_students_faculty ON dbo.students(faculty_id);
    CREATE INDEX IX_students_department ON dbo.students(department_id);
    CREATE INDEX IX_students_program ON dbo.students(program_id);
    CREATE INDEX IX_students_program_level ON dbo.students(program_level_id);
    CREATE INDEX IX_students_session ON dbo.students(current_session_id);
END;

IF OBJECT_ID(N'dbo.student_academic_records', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.student_academic_records (
        id NVARCHAR(64) PRIMARY KEY,
        student_id NVARCHAR(64) NOT NULL,
        academic_session_id NVARCHAR(64) NOT NULL,
        program_level_id NVARCHAR(64) NOT NULL,
        status NVARCHAR(20) NOT NULL,
        carryover_course_ids NVARCHAR(1000) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE INDEX IX_student_academic_records_student ON dbo.student_academic_records(student_id, created_at DESC);
END;
