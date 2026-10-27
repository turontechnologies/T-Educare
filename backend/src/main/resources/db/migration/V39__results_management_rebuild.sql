-- Replaces the minimal single-score course_results module (V35) with the
-- full marking-guide / publish-workflow design. No data migration needed —
-- the old table only ever held test-seeded live-verification rows, never
-- real production results.
DROP TABLE dbo.course_results;

CREATE TABLE dbo.marking_guides (
    institution_id NVARCHAR(64) NOT NULL PRIMARY KEY,
    name NVARCHAR(150) NOT NULL,
    updated_at DATETIME2 NOT NULL
);

CREATE TABLE dbo.marking_guide_components (
    id NVARCHAR(64) NOT NULL PRIMARY KEY,
    institution_id NVARCHAR(64) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    weight DECIMAL(5, 2) NOT NULL,
    display_order INT NOT NULL,
    created_at DATETIME2 NOT NULL
);

CREATE INDEX IX_marking_guide_components_institution ON dbo.marking_guide_components (institution_id);

CREATE TABLE dbo.results_grace_periods (
    institution_id NVARCHAR(64) NOT NULL PRIMARY KEY,
    deadline_date DATE NOT NULL,
    grace_period_days INT NOT NULL,
    updated_at DATETIME2 NOT NULL
);

CREATE TABLE dbo.course_result_scores (
    id NVARCHAR(64) NOT NULL PRIMARY KEY,
    institution_id NVARCHAR(64) NOT NULL,
    student_id NVARCHAR(64) NOT NULL,
    course_id NVARCHAR(64) NOT NULL,
    academic_semester_id NVARCHAR(64) NOT NULL,
    component_id NVARCHAR(64) NOT NULL,
    score DECIMAL(5, 2) NOT NULL,
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL
);

CREATE INDEX IX_course_result_scores_lookup
    ON dbo.course_result_scores (institution_id, course_id, academic_semester_id);
CREATE UNIQUE INDEX UX_course_result_scores_cell
    ON dbo.course_result_scores (institution_id, student_id, course_id, academic_semester_id, component_id);

CREATE TABLE dbo.course_result_submissions (
    id NVARCHAR(64) NOT NULL PRIMARY KEY,
    institution_id NVARCHAR(64) NOT NULL,
    course_id NVARCHAR(64) NOT NULL,
    academic_semester_id NVARCHAR(64) NOT NULL,
    status NVARCHAR(20) NOT NULL,
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL
);

CREATE UNIQUE INDEX UX_course_result_submissions_cell
    ON dbo.course_result_submissions (institution_id, course_id, academic_semester_id);

CREATE TABLE dbo.course_result_events (
    id NVARCHAR(64) NOT NULL PRIMARY KEY,
    institution_id NVARCHAR(64) NOT NULL,
    course_id NVARCHAR(64) NOT NULL,
    academic_semester_id NVARCHAR(64) NOT NULL,
    event_type NVARCHAR(20) NOT NULL,
    actor_name NVARCHAR(200) NOT NULL,
    reason NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL
);

CREATE INDEX IX_course_result_events_cell
    ON dbo.course_result_events (institution_id, course_id, academic_semester_id);
