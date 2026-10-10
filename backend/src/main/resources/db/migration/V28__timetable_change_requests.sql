-- A lecturer's own request to move one of their timetable slots to a
-- different day/time/venue (API_CONTRACT.md) — append-only history of the
-- request; approving it is what actually edits the real dbo.timetable_slots
-- row (see LectureAssignmentService#resolveChangeRequest).
CREATE TABLE dbo.timetable_change_requests (
    id NVARCHAR(64) PRIMARY KEY,
    institution_id NVARCHAR(64) NOT NULL,
    timetable_slot_id NVARCHAR(64) NOT NULL,
    requested_by_lecturer_id NVARCHAR(64) NOT NULL,
    proposed_day_of_week NVARCHAR(10) NOT NULL,
    proposed_start_time NVARCHAR(5) NOT NULL,
    proposed_end_time NVARCHAR(5) NOT NULL,
    proposed_venue NVARCHAR(100) NULL,
    reason NVARCHAR(500) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    resolved_at DATETIME2 NULL
);

CREATE INDEX IX_timetable_change_requests_institution ON dbo.timetable_change_requests(institution_id);
