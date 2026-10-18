export interface LeaveType {
  id: string;
  name: string;
  defaultDaysPerYear: number;
  rollover: boolean;
  /** Only meaningful when `rollover` is true; absent means no cap. */
  maxRolloverDays?: number;
  createdAt: string;
  archivedAt?: string;
}

export type LeaveRequestStatus =
  "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

/** Enriched with staff/leave-type display fields — never requires a separate lookup to render a row. */
export interface LeaveRequest {
  id: string;
  staffId: string;
  staffCode: string;
  staffName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  /** "yyyy-MM-dd". */
  startDate: string;
  /** "yyyy-MM-dd". */
  endDate: string;
  /** Workdays within [startDate, endDate], not a raw calendar-day count. */
  totalDays: number;
  reason: string;
  status: LeaveRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  resumedAt?: string;
  resumptionNote?: string;
  createdAt: string;
}

/**
 * Always computed at read time on the backend, never stored. `remainingDays`
 * can go negative — approving beyond balance is an allowed admin judgment
 * call (e.g. unpaid leave), not blocked, so this is informational only.
 */
export interface LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  year: number;
  allocatedDays: number;
  rolloverDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface StaffLeaveBalances {
  staffId: string;
  staffCode: string;
  staffName: string;
  balances: LeaveBalance[];
}
