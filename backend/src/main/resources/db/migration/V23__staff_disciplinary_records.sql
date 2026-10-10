IF COL_LENGTH('dbo.staff_members', 'disciplinary_status') IS NULL
BEGIN
    ALTER TABLE dbo.staff_members ADD disciplinary_status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_staff_members_disciplinary_status DEFAULT 'NONE';
END;

IF OBJECT_ID(N'dbo.staff_disciplinary_records', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.staff_disciplinary_records (
        id NVARCHAR(64) PRIMARY KEY,
        staff_id NVARCHAR(64) NOT NULL,
        action_type NVARCHAR(20) NOT NULL,
        reason NVARCHAR(1000) NOT NULL,
        start_date DATETIME2 NULL,
        end_date DATETIME2 NULL,
        actor_id NVARCHAR(64) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE INDEX IX_staff_disciplinary_records_staff ON dbo.staff_disciplinary_records(staff_id, created_at DESC);
END;
