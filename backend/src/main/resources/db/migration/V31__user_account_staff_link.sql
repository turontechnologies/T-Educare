-- Links a dashboard login to a real StaffMember record (com.teducare.staff),
-- the same convention as V29's lecturer_id link — so a staff account's own
-- "My Attendance" view resolves to their own clock events, never anyone
-- else's. NULL for every other account (institution_admin, a lecturer-only
-- login, etc.).
ALTER TABLE dbo.users ADD staff_id NVARCHAR(64) NULL;
