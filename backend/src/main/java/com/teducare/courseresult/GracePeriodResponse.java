package com.teducare.courseresult;

/** {@code deadlineDate} is an ISO-8601 date string ("yyyy-MM-dd"), or null if no deadline has ever been set. */
public record GracePeriodResponse(String deadlineDate, int gracePeriodDays) {
}
