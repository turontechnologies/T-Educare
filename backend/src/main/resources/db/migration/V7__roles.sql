-- V1 already created a placeholder dbo.roles (id/name/description/created_at)
-- long before the real Roles feature existed — same landmine as institutions
-- (see V3) and notifications. Nothing ever wrote to it, so it's safe to drop
-- and recreate with the full shape. Split into GO-separated batches: T-SQL's
-- compile-time column binding otherwise chokes on later statements in this
-- same file referencing institution_id, a column that (from the compiler's
-- perspective) didn't exist on the table before this script ran.
IF OBJECT_ID(N'dbo.roles', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.roles;
END;
GO

CREATE TABLE dbo.roles (
    id NVARCHAR(64) PRIMARY KEY,
    institution_id NVARCHAR(64) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(255) NULL,
    -- Comma-separated nav keys this role's accounts can see (see
    -- config/nav.ts / ModuleCatalog) — always required for a real custom
    -- role, since "unrestricted" is represented by UserAccount.role_id
    -- being NULL, never by a Role row (there is no "system role" row).
    menu_keys NVARCHAR(1000) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    archived_at DATETIME2 NULL
);

CREATE INDEX IX_roles_institution ON dbo.roles(institution_id);
GO

-- Backfill the one real Role this app already depends on: amara_bello's
-- "Front Desk Officer" restriction, previously only a frontend-mocked
-- rbac.store.ts fixture with no backend row behind it at all. Same id the
-- demo account's users.role_id has always held, so no data migration is
-- needed on the users table for her.
INSERT INTO dbo.roles (id, institution_id, name, description, menu_keys, created_at)
VALUES (
    'role-front-desk',
    'inst-ahmadubellouniversit-1',
    'Front Desk Officer',
    'Handles day-to-day registration and student records only.',
    'dashboard,registration,students',
    SYSUTCDATETIME()
);

-- turon_admin's users.role_id has held the literal string
-- 'role-institution-admin' since the very first demo seed, months before
-- "role_id IS NULL means unrestricted" became the established convention
-- (every institution created since — including real ones — follows that
-- convention correctly, e.g. sams_university's own primary admin). Align
-- this one pre-existing row with that same convention rather than
-- special-casing a legacy literal forever; DemoAccountSeeder itself no
-- longer sets this value either way, since the seeder only ever runs once
-- against an empty table (see V5's own note on this exact gotcha).
UPDATE dbo.users SET role_id = NULL WHERE id = 'um-christian-smart';
