IF NOT EXISTS (
    SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.students') AND name = 'password_hash'
)
BEGIN
    ALTER TABLE dbo.students ADD password_hash VARCHAR(200) NULL;
END
