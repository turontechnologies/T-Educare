IF NOT EXISTS (
    SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.student_identity_settings') AND name = 'default_password_hash'
)
BEGIN
    ALTER TABLE dbo.student_identity_settings ADD default_password_hash VARCHAR(200) NULL;
END
