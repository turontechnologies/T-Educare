import {
  DAYS_OF_WEEK,
  type LectureAssignment,
  type TimetableSlot,
} from "@/types/lecturer";

/** Flattens every (non-archived assignment's) timetable slot, tagged with its owning assignment, for a lecturer's own schedule views. */
export interface ScheduleEntry {
  assignment: LectureAssignment;
  slot: TimetableSlot;
}

export function flattenSchedule(
  assignments: LectureAssignment[],
): ScheduleEntry[] {
  return assignments
    .filter((a) => !a.archivedAt)
    .flatMap((assignment) =>
      assignment.timetableSlots.map((slot) => ({ assignment, slot })),
    );
}

/**
 * The chronologically-next entry from `now`, treating the week as a
 * repeating cycle (so Friday's lecture is still "next" on a Saturday
 * morning, wrapping around to the following Monday if nothing else is
 * scheduled). Returns `undefined` for an empty schedule.
 */
export function nextScheduleEntry(
  entries: ScheduleEntry[],
  now: Date = new Date(),
): ScheduleEntry | undefined {
  if (entries.length === 0) return undefined;

  const nowDayIndex = (now.getDay() + 6) % 7; // JS: Sun=0..Sat=6 -> Mon=0..Sun=6, matching DAYS_OF_WEEK order
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const withOffset = entries.map((entry) => {
    const dayIndex = DAYS_OF_WEEK.indexOf(entry.slot.dayOfWeek);
    const startMinutes = toMinutes(entry.slot.startTime);
    let dayOffset = dayIndex - nowDayIndex;
    if (dayOffset < 0 || (dayOffset === 0 && startMinutes < nowMinutes)) {
      dayOffset += 7;
    }
    return { entry, totalMinutes: dayOffset * 24 * 60 + startMinutes };
  });

  withOffset.sort((a, b) => a.totalMinutes - b.totalMinutes);
  return withOffset[0]?.entry;
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export function formatTimeRange(startTime: string, endTime: string) {
  return `${startTime} – ${endTime}`;
}
