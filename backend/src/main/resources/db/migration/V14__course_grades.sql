IF OBJECT_ID(N'dbo.course_grades', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.course_grades (
        id NVARCHAR(64) PRIMARY KEY,
        institution_id NVARCHAR(64) NOT NULL,
        code NVARCHAR(20) NOT NULL,
        remark NVARCHAR(150) NOT NULL,
        grade_score DECIMAL(5,2) NOT NULL,
        minimum_score DECIMAL(5,2) NOT NULL,
        maximum_score DECIMAL(5,2) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        archived_at DATETIME2 NULL
    );

    CREATE INDEX IX_course_grades_institution ON dbo.course_grades(institution_id);
END;

-- Single institution-wide setting, not a collection — one row per
-- institution, upserted by PUT /grading-scale (API_CONTRACT.md §7.9).
IF OBJECT_ID(N'dbo.grading_scale', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.grading_scale (
        institution_id NVARCHAR(64) PRIMARY KEY,
        max_grade_point DECIMAL(5,2) NOT NULL
    );
END;
