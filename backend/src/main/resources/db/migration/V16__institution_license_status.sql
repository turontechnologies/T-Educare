IF COL_LENGTH(N'dbo.institutions', N'license_status') IS NULL
BEGIN
    ALTER TABLE dbo.institutions ADD license_status NVARCHAR(20) NOT NULL CONSTRAINT DF_institutions_license_status DEFAULT 'ACTIVE';
END;

IF COL_LENGTH(N'dbo.institutions', N'grace_ends_at') IS NULL
BEGIN
    ALTER TABLE dbo.institutions ADD grace_ends_at DATETIME2 NULL;
END;

IF OBJECT_ID(N'dbo.institution_license_events', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.institution_license_events (
        id NVARCHAR(64) PRIMARY KEY,
        institution_id NVARCHAR(64) NOT NULL,
        event_type NVARCHAR(20) NOT NULL,
        reason NVARCHAR(500) NULL,
        actor_id NVARCHAR(64) NULL,
        grace_ends_at_snapshot DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE INDEX IX_institution_license_events_institution ON dbo.institution_license_events(institution_id, created_at DESC);
END;
