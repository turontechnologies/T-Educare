package com.teducare.leave;

/**
 * Always computed at read time, never stored: {@code allocatedDays} is the
 * leave type's own default (no per-staff override exists, by design — keeps
 * the policy in one place) plus {@code rolloverDays} carried in from last
 * year (capped at {@code LeaveType.maxRolloverDays}, 0 if the type doesn't
 * roll over); {@code usedDays} is the real sum of this staff member's
 * APPROVED requests' totalDays for the year; {@code remainingDays} can go
 * negative — approving beyond balance is an allowed admin judgment call
 * (e.g. unpaid leave), not blocked, so this is informational, not a hard cap.
 */
public record LeaveBalanceResponse(
        String leaveTypeId,
        String leaveTypeName,
        int year,
        int allocatedDays,
        int rolloverDays,
        int usedDays,
        int remainingDays) {
}
