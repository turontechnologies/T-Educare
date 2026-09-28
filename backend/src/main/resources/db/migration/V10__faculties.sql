IF OBJECT_ID(N'dbo.faculties', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.faculties (
        id NVARCHAR(64) PRIMARY KEY,
        institution_id NVARCHAR(64) NOT NULL,
        name NVARCHAR(150) NOT NULL,
        dean_name NVARCHAR(150) NOT NULL,
        school_id NVARCHAR(64) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        archived_at DATETIME2 NULL
    );

    CREATE INDEX IX_faculties_institution ON dbo.faculties(institution_id);
    CREATE INDEX IX_faculties_school ON dbo.faculties(school_id);
END;
