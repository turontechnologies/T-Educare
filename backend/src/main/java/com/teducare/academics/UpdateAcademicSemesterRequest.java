package com.teducare.academics;

import java.time.Instant;

/** Any field left null keeps its current value — same partial-update convention as institution/UpdateInstitutionRequest. */
public record UpdateAcademicSemesterRequest(
        String sessionId, String name, String description, Instant from, Instant to, String status) {
}
