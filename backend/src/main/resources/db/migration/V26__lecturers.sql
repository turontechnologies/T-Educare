-- Lecture Management (API_CONTRACT.md) — its own real resource, not a view
-- over Staff Management: a lecturer's academic rank/position and
-- school-or-faculty assignment are concepts this institution's org chart
-- needs independently of the general HR Staff Designation list (the
-- pre-backend mock's own `types/lecturer.ts` already modeled it this way).
CREATE TABLE dbo.lecturers (
    id NVARCHAR(64) PRIMARY KEY,
    institution_id NVARCHAR(64) NOT NULL,
    -- Display code, e.g. "UL-10010" — unique among this institution's
    -- non-archived lecturers (enforced in LecturerService, not the DB,
    -- same convention as Staff's staff_id/Student's matric_no).
    username NVARCHAR(50) NOT NULL,
    position NVARCHAR(50) NOT NULL,
    -- "school" | "faculty" — which table assignment_id points into.
    assignment_type NVARCHAR(10) NOT NULL,
    assignment_id NVARCHAR(64) NOT NULL,
    gender NVARCHAR(20) NOT NULL,
    first_name NVARCHAR(100) NOT NULL,
    middle_name NVARCHAR(100) NULL,
    last_name NVARCHAR(100) NOT NULL,
    other_name NVARCHAR(100) NULL,
    email NVARCHAR(150) NOT NULL,
    phone NVARCHAR(30) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    archived_at DATETIME2 NULL
);

CREATE INDEX IX_lecturers_institution ON dbo.lecturers(institution_id);
