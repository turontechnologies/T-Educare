-- Reworks the resumption report from a plain staff-submitted note into its
-- own admin-approved sub-flow, needed for three real-world cases: (1) a
-- staff member called back from leave early must get the unused days
-- credited back to their balance, but only once admin confirms the actual
-- return date; (2) a staff member who never reports resumption at all must
-- have the system keep treating every day past their approved end date as
-- an extension of the SAME leave (still deducting, still showing ON_LEAVE
-- in Attendance) rather than silently stopping; (3) a staff member who
-- under-reported late needs an appeal path to correct that over-deduction
-- retroactively, which is the same shape as case (1) just reported after
-- the auto-extension already started, with a required reason.
--
-- resumed_at/the old resumption flow's single note field are superseded by
-- this richer set — dropped rather than kept alongside, since this app has
-- no real staff relying on the old shape yet (Leave Management shipped in
-- this same engagement).
ALTER TABLE dbo.leave_requests DROP COLUMN resumed_at;

ALTER TABLE dbo.leave_requests ADD
    -- The date the staff member claims they actually resumed (their first
    -- day NOT on leave) — can be before, on, or after the original
    -- end_date; which of those determines credit-back vs. extra deduction.
    resumption_date DATE NULL,
    resumption_reported_at DATETIME2 NULL,
    -- Required only when reported after end_date has already passed (the
    -- system was already auto-extending) — the appeal's "why late" reason.
    resumption_late_reason NVARCHAR(1000) NULL,
    -- "PENDING" | "APPROVED" | "REJECTED" — null means nothing reported yet.
    resumption_status NVARCHAR(20) NULL,
    resumption_reviewed_by NVARCHAR(64) NULL,
    resumption_reviewed_at DATETIME2 NULL,
    resumption_review_note NVARCHAR(1000) NULL;
