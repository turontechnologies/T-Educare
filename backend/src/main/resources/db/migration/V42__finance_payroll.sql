IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'staff_payroll_profiles' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.staff_payroll_profiles (
        staff_id VARCHAR(64) NOT NULL PRIMARY KEY,
        institution_id VARCHAR(64) NOT NULL,
        allowances DECIMAL(14, 2) NOT NULL DEFAULT 0,
        deductions DECIMAL(14, 2) NOT NULL DEFAULT 0,
        on_hold BIT NOT NULL DEFAULT 0,
        on_hold_reason VARCHAR(300) NULL,
        updated_at DATETIME2 NOT NULL
    );
    CREATE INDEX IX_staff_payroll_profiles_institution ON dbo.staff_payroll_profiles (institution_id);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'payroll_runs' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.payroll_runs (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        institution_id VARCHAR(64) NOT NULL,
        period_year INT NOT NULL,
        period_month INT NOT NULL,
        run_by_name VARCHAR(150) NOT NULL,
        created_at DATETIME2 NOT NULL
    );
    CREATE UNIQUE INDEX UX_payroll_runs_period ON dbo.payroll_runs (institution_id, period_year, period_month);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'payslips' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.payslips (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        institution_id VARCHAR(64) NOT NULL,
        payroll_run_id VARCHAR(64) NOT NULL,
        staff_id VARCHAR(64) NOT NULL,
        period_year INT NOT NULL,
        period_month INT NOT NULL,
        basic_pay DECIMAL(14, 2) NOT NULL,
        allowances DECIMAL(14, 2) NOT NULL,
        deductions DECIMAL(14, 2) NOT NULL,
        net_pay DECIMAL(14, 2) NOT NULL,
        created_at DATETIME2 NOT NULL
    );
    CREATE UNIQUE INDEX UX_payslips_staff_period ON dbo.payslips (institution_id, staff_id, period_year, period_month);
    CREATE INDEX IX_payslips_run ON dbo.payslips (payroll_run_id);
END
