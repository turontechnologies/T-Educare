package com.teducare.leave;

import jakarta.validation.constraints.NotBlank;

/**
 * A staff member's own report that they've resumed duty after approved
 * leave. {@code resumptionDate} is their first day NOT on leave — it can
 * be before {@code endDate} (early return, credits unused days back once
 * approved), on it (the normal case), or after it (confirms an overstay).
 * {@code lateReason} is only required when this is submitted after {@code
 * endDate} has already passed — i.e. after the system has already started
 * auto-extending the leave — functioning as the appeal that explains why
 * nobody reported sooner; {@link LeaveRequestService} enforces that
 * requirement, since whether it applies depends on today's date, not
 * anything the client can self-certify.
 */
public record SubmitResumptionRequest(
        @NotBlank(message = "resumptionDate is required.") String resumptionDate,
        @NotBlank(message = "A resumption note is required.") String note,
        String lateReason) {
}
