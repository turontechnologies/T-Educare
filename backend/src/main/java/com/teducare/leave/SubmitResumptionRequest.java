package com.teducare.leave;

import jakarta.validation.constraints.NotBlank;

/** A staff member's own report that they've resumed duty after approved leave — required note, same audit-trail convention as a disciplinary action's reason. */
public record SubmitResumptionRequest(@NotBlank(message = "A resumption note is required.") String note) {
}
