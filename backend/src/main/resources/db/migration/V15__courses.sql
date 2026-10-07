IF OBJECT_ID(N'dbo.courses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.courses (
        id NVARCHAR(64) PRIMARY KEY,
        institution_id NVARCHAR(64) NOT NULL,
        name NVARCHAR(150) NOT NULL,
        code NVARCHAR(30) NOT NULL,
        department_id NVARCHAR(64) NOT NULL,
        school_id NVARCHAR(64) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        archived_at DATETIME2 NULL
    );

    CREATE INDEX IX_courses_institution ON dbo.courses(institution_id);
    CREATE INDEX IX_courses_department ON dbo.courses(department_id);
    CREATE INDEX IX_courses_school ON dbo.courses(school_id);
END;
