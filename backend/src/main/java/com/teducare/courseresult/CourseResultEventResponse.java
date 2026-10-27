package com.teducare.courseresult;

import java.time.Instant;

public record CourseResultEventResponse(String eventType, String actorName, String reason, Instant createdAt) {

    static CourseResultEventResponse from(CourseResultEvent event) {
        return new CourseResultEventResponse(
                event.getEventType(), event.getActorName(), event.getReason(), event.getCreatedAt());
    }
}
