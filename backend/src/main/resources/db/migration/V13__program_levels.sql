IF OBJECT_ID(N'dbo.program_levels', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.program_levels (
        id NVARCHAR(64) PRIMARY KEY,
        institution_id NVARCHAR(64) NOT NULL,
        level_code NVARCHAR(20) NOT NULL,
        description NVARCHAR(150) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        archived_at DATETIME2 NULL
    );

    CREATE INDEX IX_program_levels_institution ON dbo.program_levels(institution_id);
END;
