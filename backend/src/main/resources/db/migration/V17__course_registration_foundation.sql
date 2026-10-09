IF COL_LENGTH(N'dbo.courses', N'program_level_id') IS NULL
BEGIN
    ALTER TABLE dbo.courses ADD program_level_id NVARCHAR(64) NULL;
END;

IF COL_LENGTH(N'dbo.courses', N'unit') IS NULL
BEGIN
    ALTER TABLE dbo.courses ADD unit INT NOT NULL CONSTRAINT DF_courses_unit DEFAULT 0;
END;

IF OBJECT_ID(N'dbo.registration_settings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.registration_settings (
        institution_id NVARCHAR(64) PRIMARY KEY,
        require_carryover_clearance BIT NOT NULL,
        max_units_per_semester INT NOT NULL
    );
END;
