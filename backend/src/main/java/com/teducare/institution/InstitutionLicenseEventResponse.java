package com.teducare.institution;

import java.time.Instant;

public record InstitutionLicenseEventResponse(
        String id,
        String institutionId,
        String eventType,
        String reason,
        String actorId,
        Instant graceEndsAtSnapshot,
        Instant createdAt) {

    static InstitutionLicenseEventResponse from(InstitutionLicenseEvent event) {
        return new InstitutionLicenseEventResponse(
                event.getId(),
                event.getInstitutionId(),
                event.getEventType(),
                event.getReason(),
                event.getActorId(),
                event.getGraceEndsAtSnapshot(),
                event.getCreatedAt());
    }
}
