-- DemoAccountSeeder only ever seeds on an empty table, and these 3 demo
-- accounts have existed since long before V4 added code/other_name/gender/
-- is_primary_admin/archived_at — so the seeder's current code (which sets
-- all of those correctly) never actually ran against these specific rows.
-- Backfill them to match exactly what a fresh seed would produce. Harmless
-- no-op on a brand-new database (these ids won't exist yet; the seeder
-- inserts them correctly from scratch in that case).
UPDATE dbo.users SET status = 'active' WHERE id = 'demo-super-admin' AND status <> 'active';

UPDATE dbo.users
SET code = '001', other_name = '', gender = 'Male', is_primary_admin = 1, status = 'active'
WHERE id = 'um-christian-smart';

UPDATE dbo.users
SET code = '002', other_name = '', gender = 'Female', is_primary_admin = 0, status = 'active'
WHERE id = 'um-amara-bello';
