-- Leave Management (API_CONTRACT.md) — a real module under Staff Management,
-- feeding into Time & Attendance: a staff member's clock-in record for a day
-- they're on APPROVED leave reads ON_LEAVE instead of ABSENT/NOT_CLOCKED_IN
-- (see AttendanceService's integration). Admin-configured leave_types set
-- the policy (days/year, whether unused days roll over, and the cap on how
-- many); leave_requests is the single evolving record for a request's whole
-- lifecycle (PENDING -> APPROVED/REJECTED/CANCELLED, then optionally a
-- resumption report once the staff member is back) — same "one evolving
-- record, not an append-only log" shape as TimetableChangeRequest, not the
-- "cached value + immutable history" shape used elsewhere, because a leave
-- request IS the single thing being tracked, not a log of changes to some
-- other cached field. Balances are deliberately NOT stored anywhere — always
-- computed at read time from real LEAVE_TYPES allocations minus the real
-- sum of this staff member's APPROVED leave_requests for the year, the same
-- "never denormalize something computable" rule Attendance's own daily
-- status already follows.
CREATE TABLE dbo.leave_types (
    id NVARCHAR(64) PRIMARY KEY,
    institution_id NVARCHAR(64) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    default_days_per_year INT NOT NULL,
    is_rollover BIT NOT NULL DEFAULT 0,
    -- Only meaningful when is_rollover = 1; null means "no cap" (every unused day rolls over).
    max_rollover_days INT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    archived_at DATETIME2 NULL
);

CREATE INDEX IX_leave_types_institution ON dbo.leave_types(institution_id);

CREATE TABLE dbo.leave_requests (
    id NVARCHAR(64) PRIMARY KEY,
    institution_id NVARCHAR(64) NOT NULL,
    staff_id NVARCHAR(64) NOT NULL,
    leave_type_id NVARCHAR(64) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    -- Workdays within [start_date, end_date] per AttendanceSettings.workdays
    -- at the time of the request, not a raw calendar-day count — a leave
    -- request spanning a weekend shouldn't cost the staff member weekend days.
    total_days INT NOT NULL,
    reason NVARCHAR(1000) NOT NULL,
    -- "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED".
    status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by NVARCHAR(64) NULL,
    reviewed_at DATETIME2 NULL,
    review_note NVARCHAR(1000) NULL,
    -- Set once the staff member submits their resumption report — only
    -- meaningful on an APPROVED request. Null means "not back yet" (or
    -- never approved), same nullable-until-it-happens convention as a
    -- device's revoked_at.
    resumed_at DATETIME2 NULL,
    resumption_note NVARCHAR(1000) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE INDEX IX_leave_requests_institution_staff ON dbo.leave_requests(institution_id, staff_id);
CREATE INDEX IX_leave_requests_date_range ON dbo.leave_requests(institution_id, status, start_date, end_date);
