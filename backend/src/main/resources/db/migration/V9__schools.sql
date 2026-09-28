IF OBJECT_ID(N'dbo.schools', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.schools (
        id NVARCHAR(64) PRIMARY KEY,
        institution_id NVARCHAR(64) NOT NULL,
        name NVARCHAR(150) NOT NULL,
        head_name NVARCHAR(150) NOT NULL,
        -- Free text for now, matching head_name — API_CONTRACT.md §7.4 calls
        -- for validating this against /staff-designations (§8), but that
        -- resource has no real backend yet (Staff Management is still
        -- frontend-mocked). Switch this to an FK-style validation once it
        -- does, same as head_name's own documented "no directory yet" note.
        designation NVARCHAR(100) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        archived_at DATETIME2 NULL
    );

    CREATE INDEX IX_schools_institution ON dbo.schools(institution_id);
END;
