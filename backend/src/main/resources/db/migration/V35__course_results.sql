CREATE TABLE dbo.course_results (
    id NVARCHAR(64) NOT NULL PRIMARY KEY,
    institution_id NVARCHAR(64) NOT NULL,
    student_id NVARCHAR(64) NOT NULL,
    course_id NVARCHAR(64) NOT NULL,
    academic_semester_id NVARCHAR(64) NOT NULL,
    score DECIMAL(5, 2) NOT NULL,
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL
);

CREATE INDEX IX_course_results_student_semester ON dbo.course_results (institution_id, student_id, academic_semester_id);
CREATE INDEX IX_course_results_course_semester ON dbo.course_results (institution_id, course_id, academic_semester_id);
