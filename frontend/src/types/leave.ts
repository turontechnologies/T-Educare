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

export type ResumptionStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * Enriched with staff/leave-type display fields — never requires a separate
 * lookup to render a row. The resumption fields are their own admin-approved
 * sub-flow: a staff member reports `resumptionDate` (their first day NOT on
 * leave), which only takes effect — crediting unused days back, or
 * confirming extra ones used — once an admin approves it via
 * `resumptionStatus`. Until then, `isAutoExtending` tells you whether this
 * leave is *right now* silently extending past `endDate` and still
 * deducting days because nobody has reported a return yet; a resumption
 * report submitted after that point is the appeal that corrects it, and
 * carries `resumptionLateReason`. `isAutoExtending`/`daysRestored` are
 * computed by the backend on every read, never stored.
 */
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
  /** "yyyy-MM-dd" — the staff member's claimed first day back at work. */
  resumptionDate?: string;
  resumptionReportedAt?: string;
  resumptionNote?: string;
  /** Only present when reported after `endDate` had already passed — the appeal's "why late" explanation. */
  resumptionLateReason?: string;
  resumptionStatus?: ResumptionStatus;
  resumptionReviewedBy?: string;
  resumptionReviewedAt?: string;
  resumptionReviewNote?: string;
  /** True when APPROVED, no confirmed resumption yet, and today is already past `endDate` — this leave is live-extending and deducting extra days right now. */
  isAutoExtending: boolean;
  /** Only meaningful once `resumptionStatus` is "APPROVED": positive = days credited back (early return), negative = extra days deducted (confirmed overstay), zero = exactly as planned. */
  daysRestored?: number;
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
