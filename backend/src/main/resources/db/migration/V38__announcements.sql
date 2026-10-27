CREATE TABLE dbo.announcements (
    id NVARCHAR(64) NOT NULL PRIMARY KEY,
    institution_id NVARCHAR(64) NOT NULL,
    headline NVARCHAR(300) NOT NULL,
    body NVARCHAR(MAX) NOT NULL,
    send_via_app BIT NOT NULL,
    send_via_email BIT NOT NULL,
    target_scope NVARCHAR(30) NOT NULL,
    target_value NVARCHAR(64) NULL,
    status NVARCHAR(20) NOT NULL,
    scheduled_for DATETIME2 NULL,
    sent_at DATETIME2 NULL,
    created_by_name NVARCHAR(200) NOT NULL,
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL
);

CREATE INDEX IX_announcements_institution_status ON dbo.announcements (institution_id, status);

CREATE TABLE dbo.announcement_attachments (
    id NVARCHAR(64) NOT NULL PRIMARY KEY,
    announcement_id NVARCHAR(64) NOT NULL,
    file_name NVARCHAR(300) NOT NULL,
    file_url NVARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    created_at DATETIME2 NOT NULL
);

CREATE INDEX IX_announcement_attachments_announcement ON dbo.announcement_attachments (announcement_id);
