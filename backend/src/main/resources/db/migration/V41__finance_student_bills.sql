IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'student_bill_payments' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.student_bill_payments (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        institution_id VARCHAR(64) NOT NULL,
        student_id VARCHAR(64) NOT NULL,
        bill_line_id VARCHAR(64) NOT NULL,
        amount DECIMAL(14, 2) NOT NULL,
        method VARCHAR(20) NOT NULL,
        reference VARCHAR(100) NULL,
        payment_date DATE NOT NULL,
        proof_url VARCHAR(500) NULL,
        recorded_by_name VARCHAR(150) NOT NULL,
        created_at DATETIME2 NOT NULL
    );
    CREATE INDEX IX_student_bill_payments_institution_student ON dbo.student_bill_payments (institution_id, student_id);
    CREATE INDEX IX_student_bill_payments_bill_line ON dbo.student_bill_payments (bill_line_id);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'finance_transaction_log' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.finance_transaction_log (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        institution_id VARCHAR(64) NOT NULL,
        event_type VARCHAR(40) NOT NULL,
        student_id VARCHAR(64) NULL,
        staff_id VARCHAR(64) NULL,
        amount DECIMAL(14, 2) NULL,
        reference VARCHAR(100) NULL,
        details TEXT NOT NULL,
        recorded_by_name VARCHAR(150) NOT NULL,
        created_at DATETIME2 NOT NULL
    );
    CREATE INDEX IX_finance_transaction_log_institution ON dbo.finance_transaction_log (institution_id, created_at DESC);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'paystack_settings' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.paystack_settings (
        institution_id VARCHAR(64) NOT NULL PRIMARY KEY,
        public_key VARCHAR(200) NOT NULL,
        secret_key VARCHAR(200) NOT NULL,
        enabled BIT NOT NULL DEFAULT 1,
        updated_at DATETIME2 NOT NULL
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'paystack_transactions' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.paystack_transactions (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        institution_id VARCHAR(64) NOT NULL,
        student_id VARCHAR(64) NOT NULL,
        reference VARCHAR(100) NOT NULL,
        amount DECIMAL(14, 2) NOT NULL,
        status VARCHAR(20) NOT NULL,
        authorization_url VARCHAR(500) NULL,
        created_at DATETIME2 NOT NULL,
        paid_at DATETIME2 NULL
    );
    CREATE UNIQUE INDEX UX_paystack_transactions_reference ON dbo.paystack_transactions (reference);
    CREATE INDEX IX_paystack_transactions_institution_student ON dbo.paystack_transactions (institution_id, student_id);
END
