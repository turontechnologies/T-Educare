import type {
  RolloverAcademicRecord,
  RolloverCourseResult,
  RolloverStudentLevel,
  RolloverStudentProfile,
} from "@/types/rollover";
import { ROLLOVER_STUDENT_LEVELS } from "@/types/rollover";

const CURRENT_SESSION_ID = "session-2025-2026";

const COURSES_BY_LEVEL: Record<
  RolloverStudentLevel,
  { code: string; title: string }[]
> = {
  "100 Level": [
    { code: "CSC101", title: "Introduction to Computer Science" },
    { code: "MTH101", title: "Elementary Mathematics I" },
    { code: "GST101", title: "General Studies I" },
  ],
  "200 Level": [
    { code: "CSC201", title: "Computer Programming I" },
    { code: "CSC202", title: "Data Structures" },
    { code: "GST201", title: "General Studies II" },
  ],
  "300 Level": [
    { code: "CSC301", title: "Operating Systems" },
    { code: "CSC302", title: "Database Management Systems" },
    { code: "ENT301", title: "Entrepreneurship Studies" },
  ],
  "400 Level": [
    { code: "CSC401", title: "Artificial Intelligence" },
    { code: "PRJ401", title: "Final Year Project" },
    { code: "GST401", title: "General Studies IV" },
  ],
};

const FIRST_NAMES = [
  "Chidinma",
  "Tobiloba",
  "Emeka",
  "Halima",
  "Ifeanyi",
  "Kemi",
  "Damilola",
  "Uche",
  "Aisha",
  "Segun",
];
const LAST_NAMES = [
  "Okafor",
  "Balogun",
  "Eze",
  "Mohammed",
  "Nwosu",
  "Adeleke",
  "Okonkwo",
  "Ibrahim",
  "Adebayo",
  "Chukwu",
];

function nameFor(index: number) {
  return {
    firstName: FIRST_NAMES[index % FIRST_NAMES.length],
    lastName: LAST_NAMES[(index + 3) % LAST_NAMES.length],
  };
}

/** Deterministic: most students pass clean, some carry over, a few repeat — same spread the old mock used. */
function failCountFor(index: number) {
  if (index % 7 === 0) return 3;
  if (index % 5 === 3) return 1 + (index % 2);
  return 0;
}

function buildAcademicRecord(
  level: RolloverStudentLevel,
  failCount: number,
): RolloverAcademicRecord {
  const courses = COURSES_BY_LEVEL[level];
  const courseResults: RolloverCourseResult[] = courses.map((course, i) => {
    const failed = i < failCount;
    return {
      courseCode: course.code,
      courseTitle: course.title,
      score: failed ? 32 + i * 3 : 62 + i * 4,
      grade: failed ? "F" : i === 0 ? "A" : "B",
      passed: !failed,
      sessionId: CURRENT_SESSION_ID,
      attempt: 1,
    };
  });
  return {
    sessionId: CURRENT_SESSION_ID,
    level,
    status: "completed",
    courseResults,
    carryoverCourses: courseResults
      .filter((c) => !c.passed)
      .map((c) => c.courseCode),
  };
}

const LEVEL_PLAN: { level: RolloverStudentLevel; count: number }[] = [
  { level: "100 Level", count: 5 },
  { level: "200 Level", count: 4 },
  { level: "300 Level", count: 4 },
  { level: "400 Level", count: 3 },
];

/** A small, deterministic demo roster — Rollover's own standalone seed, not the real Students backend (see `types/rollover.ts` for why). */
export function buildRolloverSeedRoster(): RolloverStudentProfile[] {
  const roster: RolloverStudentProfile[] = [];
  let index = 0;

  for (const { level, count } of LEVEL_PLAN) {
    for (let i = 0; i < count; i++) {
      const failCount = failCountFor(index);
      const { firstName, lastName } = nameFor(index);
      const isDeferred = level === "100 Level" && i === 2;
      const holdForReview = level === "300 Level" && i === 1;

      roster.push({
        id: `rollover-student-${index}`,
        matricNo: `UL-${10000 + index}`,
        firstName,
        lastName,
        programme: "B.Sc. Computer Science",
        currentLevel: level,
        currentSessionId: CURRENT_SESSION_ID,
        status: "active",
        isGraduating: false,
        isDeferred,
        holdForReview,
        academicHistory: [buildAcademicRecord(level, failCount)],
        archivedAt: null,
      });
      index++;
    }
  }

  return roster;
}

export { ROLLOVER_STUDENT_LEVELS };
