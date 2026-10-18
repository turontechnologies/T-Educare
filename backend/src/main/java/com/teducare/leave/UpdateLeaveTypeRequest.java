package com.teducare.leave;

/** Any field left null keeps its current value — same partial-update convention used throughout this backend. */
public record UpdateLeaveTypeRequest(
        String name,
        Integer defaultDaysPerYear,
        Boolean rollover,
        Integer maxRolloverDays,
        /** True clears maxRolloverDays back to "no cap" — distinguishing "leave unchanged" (omit) from "clear it" (true) is why this isn't just a null maxRolloverDays. */
        Boolean clearMaxRolloverDays) {
}
