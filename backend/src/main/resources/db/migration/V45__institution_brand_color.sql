IF NOT EXISTS (
    SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.institutions') AND name = 'brand_color'
)
BEGIN
    ALTER TABLE dbo.institutions ADD brand_color VARCHAR(20) NULL;
END
