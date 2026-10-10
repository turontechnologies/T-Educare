-- "Lectures" (API_CONTRACT.md) — which Lecturer teaches which Course, for a
-- given session, plus the recurring weekly slot(s) that assignment is
-- scheduled at (the timetable). Deliberately keyed to the real Lecturer
-- resource (dbo.lecturers), not Staff — Lecture Management owns this
-- end-to-end, independent of Course.lecturer_id (Staff Management's own,
-- separate "who's assigned to this course" field).
CREATE TABLE dbo.lecture_assignments (
    id NVARCHAR(64) PRIMARY KEY,
    institution_id NVARCHAR(64) NOT NULL,
    lecturer_id NVARCHAR(64) NOT NULL,
    course_id NVARCHAR(64) NOT NULL,
    academic_session_id NVARCHAR(64) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    archived_at DATETIME2 NULL
);

CREATE INDEX IX_lecture_assignments_institution ON dbo.lecture_assignments(institution_id);
GO

-- A recurring weekly slot for an assignment — "Mon 10:00-12:00, Room 4".
-- Leaf sub-resource (same "editable list, hard-deleted" convention as
-- StaffQualification), so no archived_at — a removed slot is just gone.
CREATE TABLE dbo.timetable_slots (
    id NVARCHAR(64) PRIMARY KEY,
    lecture_assignment_id NVARCHAR(64) NOT NULL,
    day_of_week NVARCHAR(10) NOT NULL,
    start_time NVARCHAR(5) NOT NULL,
    end_time NVARCHAR(5) NOT NULL,
    venue NVARCHAR(100) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE INDEX IX_timetable_slots_assignment ON dbo.timetable_slots(lecture_assignment_id);
