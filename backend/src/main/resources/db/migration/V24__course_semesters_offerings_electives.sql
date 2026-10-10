IF COL_LENGTH('dbo.courses', 'semester_number') IS NULL
BEGIN
    ALTER TABLE dbo.courses ADD semester_number INT NULL;
END;

IF COL_LENGTH('dbo.academic_semesters', 'semester_number') IS NULL
BEGIN
    ALTER TABLE dbo.academic_semesters ADD semester_number INT NULL;
END;

IF OBJECT_ID(N'dbo.course_department_offerings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.course_department_offerings (
        id NVARCHAR(64) PRIMARY KEY,
        institution_id NVARCHAR(64) NOT NULL,
        course_id NVARCHAR(64) NOT NULL,
        department_id NVARCHAR(64) NOT NULL,
        unit_override INT NULL,
        compulsory BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE INDEX IX_course_department_offerings_course ON dbo.course_department_offerings(course_id);
    CREATE INDEX IX_course_department_offerings_department ON dbo.course_department_offerings(department_id);
END;

IF OBJECT_ID(N'dbo.elective_groups', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.elective_groups (
        id NVARCHAR(64) PRIMARY KEY,
        institution_id NVARCHAR(64) NOT NULL,
        department_id NVARCHAR(64) NOT NULL,
        program_level_id NVARCHAR(64) NOT NULL,
        name NVARCHAR(150) NOT NULL,
        min_select INT NOT NULL,
        max_select INT NOT NULL,
        course_ids NVARCHAR(1000) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        archived_at DATETIME2 NULL
    );

    CREATE INDEX IX_elective_groups_institution ON dbo.elective_groups(institution_id);
END;
