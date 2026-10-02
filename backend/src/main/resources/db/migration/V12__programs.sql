IF OBJECT_ID(N'dbo.programs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.programs (
        id NVARCHAR(64) PRIMARY KEY,
        institution_id NVARCHAR(64) NOT NULL,
        name NVARCHAR(150) NOT NULL,
        department_id NVARCHAR(64) NOT NULL,
        faculty_id NVARCHAR(64) NOT NULL,
        program_type NVARCHAR(20) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        archived_at DATETIME2 NULL
    );

    CREATE INDEX IX_programs_institution ON dbo.programs(institution_id);
    CREATE INDEX IX_programs_department ON dbo.programs(department_id);
    CREATE INDEX IX_programs_faculty ON dbo.programs(faculty_id);
END;
