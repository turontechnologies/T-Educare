-- Time & Attendance (API_CONTRACT.md) — a real module under Staff
-- Management: institution-wide resumption/closing times + a grace period,
-- registered biometric devices that push clock events via a per-device API
-- key (no institution_admin login involved — a physical machine or its
-- middleware calls this), and the append-only clock-event log itself.
-- Daily PRESENT/LATE/ABSENT status is deliberately NOT stored — it's always
-- derived from events + settings at read time (see AttendanceService), the
-- same "never denormalize something computable" rule this backend already
-- follows for institution name/logo at login.
CREATE TABLE dbo.attendance_settings (
    institution_id NVARCHAR(64) PRIMARY KEY,
    resumption_time NVARCHAR(5) NOT NULL DEFAULT '08:00',
    closing_time NVARCHAR(5) NOT NULL DEFAULT '17:00',
    -- Minutes of grace after resumption_time before a clock-in counts as LATE.
    grace_period_minutes INT NOT NULL DEFAULT 15,
    -- Comma-separated subset of MONDAY..SUNDAY this institution treats as a workday.
    workdays NVARCHAR(100) NOT NULL DEFAULT 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY',
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.attendance_devices (
    id NVARCHAR(64) PRIMARY KEY,
    institution_id NVARCHAR(64) NOT NULL,
    name NVARCHAR(150) NOT NULL,
    location NVARCHAR(150) NULL,
    -- BCrypt hash of the device's API key — the plaintext key is shown to the
    -- admin exactly once at creation, the same "can't be retrieved again"
    -- convention as every password in this app.
    api_key_hash NVARCHAR(255) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'active',
    last_seen_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    revoked_at DATETIME2 NULL
);

CREATE INDEX IX_attendance_devices_institution ON dbo.attendance_devices(institution_id);

CREATE TABLE dbo.attendance_events (
    id NVARCHAR(64) PRIMARY KEY,
    institution_id NVARCHAR(64) NOT NULL,
    staff_id NVARCHAR(64) NOT NULL,
    -- "CLOCK_IN" | "CLOCK_OUT".
    event_type NVARCHAR(10) NOT NULL,
    occurred_at DATETIME2 NOT NULL,
    -- Null means a manual entry (an admin recorded it, e.g. the device was down).
    device_id NVARCHAR(64) NULL,
    -- Who recorded this: "DEVICE" (pushed by a biometric machine) or "MANUAL" (an admin).
    source NVARCHAR(10) NOT NULL,
    -- Only present for a MANUAL entry — required there, per the same
    -- audit-trail convention as a disciplinary action's reason.
    note NVARCHAR(500) NULL,
    recorded_by NVARCHAR(64) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE INDEX IX_attendance_events_institution_staff ON dbo.attendance_events(institution_id, staff_id);
CREATE INDEX IX_attendance_events_occurred_at ON dbo.attendance_events(occurred_at);
