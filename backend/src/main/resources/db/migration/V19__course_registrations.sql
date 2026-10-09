IF OBJECT_ID(N'dbo.course_registrations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.course_registrations (
        id NVARCHAR(64) PRIMARY KEY,
        institution_id NVARCHAR(64) NOT NULL,
        student_id NVARCHAR(64) NOT NULL,
        course_id NVARCHAR(64) NOT NULL,
        academic_semester_id NVARCHAR(64) NOT NULL,
        unit_snapshot INT NOT NULL,
        is_carryover BIT NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE INDEX IX_course_registrations_lookup
        ON dbo.course_registrations(institution_id, student_id, academic_semester_id);
END;
