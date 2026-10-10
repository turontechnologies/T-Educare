IF COL_LENGTH('dbo.students', 'pre_admission_id') IS NULL
BEGIN
    ALTER TABLE dbo.students ADD pre_admission_id NVARCHAR(20) NULL;
END;

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

IF COL_LENGTH('dbo.students', 'jamb_reg_number') IS NULL
BEGIN
    ALTER TABLE dbo.students ADD jamb_reg_number NVARCHAR(50) NULL;
END;

IF COL_LENGTH('dbo.students', 'admission_mode') IS NULL
BEGIN
    ALTER TABLE dbo.students ADD admission_mode NVARCHAR(20) NOT NULL CONSTRAINT DF_students_admission_mode DEFAULT 'UTME';
END;
