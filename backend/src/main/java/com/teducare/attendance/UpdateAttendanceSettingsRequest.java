package com.teducare.attendance;

import java.util.List;

/** Any field left null keeps its current value — same partial-update convention used throughout this backend. */
public record UpdateAttendanceSettingsRequest(
        String resumptionTime,
        String closingTime,
        Integer gracePeriodMinutes,
        List<String> workdays) {
}
