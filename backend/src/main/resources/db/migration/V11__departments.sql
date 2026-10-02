IF OBJECT_ID(N'dbo.departments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.departments (
        id NVARCHAR(64) PRIMARY KEY,
        institution_id NVARCHAR(64) NOT NULL,
        name NVARCHAR(150) NOT NULL,
        hod_name NVARCHAR(150) NOT NULL,
        faculty_id NVARCHAR(64) NOT NULL,
        school_id NVARCHAR(64) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        archived_at DATETIME2 NULL
    );

    CREATE INDEX IX_departments_institution ON dbo.departments(institution_id);
    CREATE INDEX IX_departments_faculty ON dbo.departments(faculty_id);
    CREATE INDEX IX_departments_school ON dbo.departments(school_id);
END;
