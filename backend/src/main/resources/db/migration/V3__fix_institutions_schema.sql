-- V1 already created a placeholder dbo.institutions (id/name/code/status/created_at)
-- long before the real Institutions feature existed. V2's own "IF OBJECT_ID(...) IS
-- NULL" guard then silently skipped creating the real table, since one already
-- existed — leaving the stub in place. It has never held any real data (nothing
-- ever wrote to it), so it's safe to drop and recreate with the full shape.
IF OBJECT_ID(N'dbo.institutions', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.institutions;
END;

CREATE TABLE dbo.institutions (
    id NVARCHAR(64) PRIMARY KEY,
    code NVARCHAR(10) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    institution_type NVARCHAR(50) NOT NULL,
    address NVARCHAR(500) NULL,
    city NVARCHAR(100) NULL,
    country_state NVARCHAR(100) NULL,
    principal_name NVARCHAR(255) NULL,
    principal_email NVARCHAR(255) NULL,
    principal_phone NVARCHAR(30) NULL,
    admin_user NVARCHAR(255) NULL,
    admin_email NVARCHAR(255) NULL,
    logo_url NVARCHAR(500) NULL,
    module_keys NVARCHAR(1000) NULL,
    modules_last_edited_at DATETIME2 NULL,
    modules_count INT NOT NULL DEFAULT 0,
    student_count INT NOT NULL DEFAULT 0,
    revenue BIGINT NOT NULL DEFAULT 0,
    license_type NVARCHAR(20) NOT NULL DEFAULT 'Basic',
    expiring_at DATETIME2 NULL,
    token_key NVARCHAR(50) NOT NULL,
    license_key NVARCHAR(50) NULL,
    license_issued_at DATETIME2 NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    archived_at DATETIME2 NULL
);
