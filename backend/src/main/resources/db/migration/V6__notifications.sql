IF OBJECT_ID(N'dbo.notifications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.notifications (
        id NVARCHAR(64) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        message NVARCHAR(1000) NOT NULL,
        href NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        is_read BIT NOT NULL DEFAULT 0,
        scope_type NVARCHAR(20) NOT NULL,
        scope_institution_id NVARCHAR(64) NULL,
        scope_user_id NVARCHAR(64) NULL
    );

    CREATE INDEX IX_notifications_scope_institution ON dbo.notifications(scope_institution_id);
    CREATE INDEX IX_notifications_scope_user ON dbo.notifications(scope_user_id);
    CREATE INDEX IX_notifications_created_at ON dbo.notifications(created_at DESC);
END;
