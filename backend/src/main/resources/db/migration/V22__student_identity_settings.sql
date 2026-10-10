IF OBJECT_ID(N'dbo.student_identity_settings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.student_identity_settings (
        institution_id NVARCHAR(64) PRIMARY KEY,
        pre_student_identifier_preference NVARCHAR(30) NOT NULL
    );
END;
