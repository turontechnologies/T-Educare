package com.teducare.attendance;

import java.time.Instant;
import java.util.List;

public record AttendanceSettingsResponse(
        String resumptionTime,
        String closingTime,
        int gracePeriodMinutes,
        List<String> workdays,
        Instant updatedAt) {

    static AttendanceSettingsResponse from(AttendanceSettings settings) {
        return new AttendanceSettingsResponse(
                settings.getResumptionTime(),
                settings.getClosingTime(),
                settings.getGracePeriodMinutes(),
                List.of(settings.getWorkdays().split(",")),
                settings.getUpdatedAt());
    }
}
