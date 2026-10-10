-- Split into GO-separated batches: T-SQL's compile-time column binding
-- otherwise chokes on the UPDATE/ALTER COLUMN statements below referencing
-- pre_admission_id, a column that (from the compiler's perspective) didn't
-- exist on the table before the preceding ALTER TABLE ran — same landmine
-- V7's own comment documents for dbo.roles.institution_id.
IF COL_LENGTH('dbo.students', 'pre_admission_id') IS NULL
BEGIN
    ALTER TABLE dbo.students ADD pre_admission_id NVARCHAR(20) NULL;
END;
GO

-- Backfill: derived deterministically from each row's own id, so every
-- pre-existing student (even a pre-student with no matric_no) gets a real,
-- collision-free value before the column becomes NOT NULL below.
UPDATE dbo.students
SET pre_admission_id = 'PRE-' + UPPER(RIGHT(REPLACE(id, '-', ''), 8))
WHERE pre_admission_id IS NULL;

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.students') AND name = 'pre_admission_id' AND is_nullable = 1
)
BEGIN
    ALTER TABLE dbo.students ALTER COLUMN pre_admission_id NVARCHAR(20) NOT NULL;
END;
GO

IF COL_LENGTH('dbo.students', 'jamb_reg_number') IS NULL
BEGIN
    ALTER TABLE dbo.students ADD jamb_reg_number NVARCHAR(50) NULL;
END;

IF COL_LENGTH('dbo.students', 'admission_mode') IS NULL
BEGIN
    ALTER TABLE dbo.students ADD admission_mode NVARCHAR(20) NOT NULL CONSTRAINT DF_students_admission_mode DEFAULT 'UTME';
END;
