package com.teducare.academics;

import java.time.Instant;

/** Any field left null keeps its current value — same partial-update convention as institution/UpdateInstitutionRequest. */
public record UpdateAcademicSessionRequest(String session, Instant from, Instant to, String status) {
}
