-- Links a dashboard login to a real Lecturer record (com.teducare.lecturer),
-- so Lecture Management can show that account a self-service "My Lectures"
-- view instead of the full admin table. NULL for every other account.
ALTER TABLE dbo.users ADD lecturer_id NVARCHAR(64) NULL;
