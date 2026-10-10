IF OBJECT_ID(N'dbo.staff_designations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.staff_designations (
        id NVARCHAR(64) PRIMARY KEY,
        institution_id NVARCHAR(64) NOT NULL,
        name NVARCHAR(150) NOT NULL,
        description NVARCHAR(1000) NULL,
        category NVARCHAR(30) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        archived_at DATETIME2 NULL
    );

    CREATE INDEX IX_staff_designations_institution ON dbo.staff_designations(institution_id);
END;

IF OBJECT_ID(N'dbo.staff_members', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.staff_members (
        id NVARCHAR(64) PRIMARY KEY,
        institution_id NVARCHAR(64) NOT NULL,
        staff_id NVARCHAR(50) NOT NULL,
        role_id NVARCHAR(64) NOT NULL,
        designation_id NVARCHAR(64) NOT NULL,
        department_id NVARCHAR(64) NOT NULL,
        gender NVARCHAR(20) NOT NULL,
        first_name NVARCHAR(100) NOT NULL,
        middle_name NVARCHAR(100) NULL,
        last_name NVARCHAR(100) NOT NULL,
        other_name NVARCHAR(100) NULL,
        marital_status NVARCHAR(20) NOT NULL,
        email NVARCHAR(150) NOT NULL,
        phone NVARCHAR(30) NOT NULL,
        emergency_contact NVARCHAR(150) NOT NULL,
        date_of_birth DATETIME2 NOT NULL,
        employment_start_date DATETIME2 NOT NULL,
        contact_address NVARCHAR(500) NOT NULL,
        avatar_url NVARCHAR(500) NULL,
        salary_amount DECIMAL(14, 2) NULL,
        salary_currency NVARCHAR(10) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        archived_at DATETIME2 NULL
    );

    CREATE INDEX IX_staff_members_institution ON dbo.staff_members(institution_id);
    CREATE INDEX IX_staff_members_department ON dbo.staff_members(department_id);
END;

IF OBJECT_ID(N'dbo.staff_qualifications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.staff_qualifications (
        id NVARCHAR(64) PRIMARY KEY,
        staff_id NVARCHAR(64) NOT NULL,
        degree NVARCHAR(150) NOT NULL,
        field_of_study NVARCHAR(200) NOT NULL,
        institution_attended NVARCHAR(200) NOT NULL,
        year_obtained INT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE INDEX IX_staff_qualifications_staff ON dbo.staff_qualifications(staff_id, created_at DESC);
END;

IF COL_LENGTH('dbo.courses', 'lecturer_id') IS NULL
BEGIN
    ALTER TABLE dbo.courses ADD lecturer_id NVARCHAR(64) NULL;
END;
