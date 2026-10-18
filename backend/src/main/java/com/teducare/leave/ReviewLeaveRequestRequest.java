package com.teducare.leave;

/** note is optional on approve, required on reject (enforced in LeaveRequestService, not here — "required" depends on which action this accompanies). */
public record ReviewLeaveRequestRequest(String note) {
}
