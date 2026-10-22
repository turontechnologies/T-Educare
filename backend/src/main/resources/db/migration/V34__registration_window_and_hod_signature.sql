ALTER TABLE dbo.registration_settings ADD registration_opens_at DATETIME2 NULL;
ALTER TABLE dbo.registration_settings ADD registration_closes_at DATETIME2 NULL;
ALTER TABLE dbo.registration_settings ADD registration_grace_period_ends_at DATETIME2 NULL;

ALTER TABLE dbo.departments ADD hod_signature_url NVARCHAR(500) NULL;
