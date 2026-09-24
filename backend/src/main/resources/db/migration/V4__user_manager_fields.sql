ALTER TABLE dbo.users ADD code NVARCHAR(10) NULL;
ALTER TABLE dbo.users ADD other_name NVARCHAR(100) NULL;
ALTER TABLE dbo.users ADD gender NVARCHAR(20) NULL;
ALTER TABLE dbo.users ADD is_primary_admin BIT NOT NULL CONSTRAINT DF_users_is_primary_admin DEFAULT 0;
ALTER TABLE dbo.users ADD archived_at DATETIME2 NULL;

-- V1 seeded this column uppercase ('ACTIVE'); nothing has read or written
-- it until now (UserAccount never mapped it) — normalize to the lowercase
-- convention used everywhere else in this API (status: "active"|"inactive").
UPDATE dbo.users SET status = LOWER(status) WHERE status <> LOWER(status);
