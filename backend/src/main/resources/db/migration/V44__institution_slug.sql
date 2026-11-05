IF NOT EXISTS (
    SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.institutions') AND name = 'slug'
)
BEGIN
    ALTER TABLE dbo.institutions ADD slug VARCHAR(80) NULL;
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name = 'UQ_institutions_slug' AND object_id = OBJECT_ID('dbo.institutions')
)
BEGIN
    CREATE UNIQUE INDEX UQ_institutions_slug ON dbo.institutions(slug) WHERE slug IS NOT NULL;
END
