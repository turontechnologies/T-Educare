IF OBJECT_ID(N'dbo.academic_sessions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.academic_sessions (
        id NVARCHAR(64) PRIMARY KEY,
        institution_id NVARCHAR(64) NOT NULL,
        session NVARCHAR(20) NOT NULL,
        from_date DATETIME2 NOT NULL,
        to_date DATETIME2 NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'upcoming',
        is_current BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        archived_at DATETIME2 NULL
    );

    CREATE INDEX IX_academic_sessions_institution ON dbo.academic_sessions(institution_id);
END;

IF OBJECT_ID(N'dbo.academic_semesters', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.academic_semesters (
        id NVARCHAR(64) PRIMARY KEY,
        institution_id NVARCHAR(64) NOT NULL,
        session_id NVARCHAR(64) NOT NULL,
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500) NULL,
        from_date DATETIME2 NOT NULL,
        to_date DATETIME2 NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'upcoming',
        is_current BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        archived_at DATETIME2 NULL
    );

    CREATE INDEX IX_academic_semesters_institution ON dbo.academic_semesters(institution_id);
    CREATE INDEX IX_academic_semesters_session ON dbo.academic_semesters(session_id);
END;
