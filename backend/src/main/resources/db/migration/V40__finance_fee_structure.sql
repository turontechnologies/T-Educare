IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'fee_types' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.fee_types (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        institution_id VARCHAR(64) NOT NULL,
        code VARCHAR(20) NOT NULL,
        name VARCHAR(150) NOT NULL,
        department_id VARCHAR(64) NULL,
        program_level_id VARCHAR(64) NULL,
        academic_session_id VARCHAR(64) NOT NULL,
        amount DECIMAL(14, 2) NOT NULL,
        due_date DATE NOT NULL,
        late_penalty_type VARCHAR(20) NOT NULL DEFAULT 'NONE',
        late_penalty_value DECIMAL(14, 2) NULL,
        created_at DATETIME2 NOT NULL,
        archived_at DATETIME2 NULL
    );
    CREATE INDEX IX_fee_types_institution ON dbo.fee_types (institution_id);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'student_bill_lines' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.student_bill_lines (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        institution_id VARCHAR(64) NOT NULL,
        student_id VARCHAR(64) NOT NULL,
        fee_type_id VARCHAR(64) NOT NULL,
        line_type VARCHAR(20) NOT NULL,
        parent_line_id VARCHAR(64) NULL,
        description VARCHAR(200) NOT NULL,
        reference VARCHAR(30) NOT NULL,
        charge_amount DECIMAL(14, 2) NOT NULL,
        balance DECIMAL(14, 2) NOT NULL,
        due_date DATE NOT NULL,
        academic_session_id VARCHAR(64) NOT NULL,
        created_at DATETIME2 NOT NULL,
        updated_at DATETIME2 NOT NULL
    );
    CREATE INDEX IX_student_bill_lines_institution_student ON dbo.student_bill_lines (institution_id, student_id);
    CREATE INDEX IX_student_bill_lines_fee_type ON dbo.student_bill_lines (fee_type_id);
    -- One CHARGE line per (student, fee) — guards against double-billing if a fee edit's
    -- regeneration pass ever runs twice; PENALTY lines are exempt since a charge can only
    -- ever accrue at most one open penalty anyway (enforced in application code instead).
    CREATE UNIQUE INDEX UX_student_bill_lines_student_fee_charge
        ON dbo.student_bill_lines (institution_id, student_id, fee_type_id)
        WHERE line_type = 'CHARGE';
END
