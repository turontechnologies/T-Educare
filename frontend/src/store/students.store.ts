import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CourseResult,
  Student,
  StudentAcademicRecord,
  StudentLevel,
} from "@/types/student";

const CURRENT_SESSION_ID = "session-2025-2026";

const COURSES_BY_LEVEL: Record<
  StudentLevel,
  { code: string; title: string }[]
> = {
  "100 Level": [
    { code: "CSC101", title: "Introduction to Computer Science" },
    { code: "MTH101", title: "Elementary Mathematics I" },
    { code: "PHY101", title: "General Physics I" },
    { code: "ENG101", title: "Use of English" },
    { code: "GST101", title: "General Studies I" },
  ],
  "200 Level": [
    { code: "CSC201", title: "Computer Programming I" },
    { code: "CSC202", title: "Data Structures" },
    { code: "MTH201", title: "Mathematical Methods" },
    { code: "STA201", title: "Probability & Statistics" },
    { code: "GST201", title: "General Studies II" },
  ],
  "300 Level": [
    { code: "CSC301", title: "Operating Systems" },
    { code: "CSC302", title: "Database Management Systems" },
    { code: "CSC303", title: "Software Engineering" },
    { code: "MTH301", title: "Numerical Analysis" },
    { code: "ENT301", title: "Entrepreneurship Studies" },
  ],
  "400 Level": [
    { code: "CSC401", title: "Artificial Intelligence" },
    { code: "CSC402", title: "Computer Networks" },
    { code: "CSC403", title: "Distributed Systems" },
    { code: "PRJ401", title: "Final Year Project" },
    { code: "GST401", title: "General Studies IV" },
  ],
  "500 Level": [],
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
  "Ngozi",
  "Yusuf",
  "Bukola",
  "Chinedu",
  "Fatima",
  "Olamide",
  "Nneka",
  "Abubakar",
  "Temitope",
  "Chiamaka",
  "Gbenga",
  "Amina",
  "Obinna",
  "Folake",
  "Suleiman",
  "Adaeze",
  "Kunle",
  "Zainab",
  "Ikechukwu",
  "Bolanle",
  "Musa",
  "Ngozika",
  "Rotimi",
  "Hadiza",
  "Chukwuemeka",
  "Simisola",
  "Nnamdi",
  "Fadekemi",
  "Tunde",
  "Blessing",
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
  "Yusuf",
  "Okoro",
  "Bello",
  "Nnaji",
  "Abdullahi",
  "Fashola",
  "Uzoma",
  "Aliyu",
  "Adeyemi",
  "Onyekwere",
];

/** Pure/deterministic — no `Math.random`, so the roster is identical on every reload rather than a fresh random draw. */
function nameFor(index: number) {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[index % LAST_NAMES.length];
  return `${first} ${last}`;
}

function studentIdFor(index: number) {
  return `STU/2022/${String(1000 + index)}`;
}

/**
 * Deterministically decides how many of a level's 5 courses this student
 * fails, purely from their index — no randomness, so re-seeding always
 * produces the same roster (and the same rollover-preview counts) to
 * demo against.
 *   - most students (index % 5 < 3): 0 fails → clean
 *   - some (index % 5 === 3): 1-2 fails → carryover-eligible
 *   - a few (index % 7 === 0, overrides above): 3 fails → repeat-eligible
 */
function failCountFor(index: number) {
  if (index % 7 === 0) return 3;
  if (index % 5 === 3) return 1 + (index % 2);
  return 0;
}

function buildAcademicRecord(
  level: StudentLevel,
  sessionId: string,
  failCount: number,
): StudentAcademicRecord {
  const courses = COURSES_BY_LEVEL[level];
  const courseResults: CourseResult[] = courses.map((course, i) => {
    const failed = i < failCount;
    return {
      courseCode: course.code,
      courseTitle: course.title,
      score: failed ? 32 + i * 3 : 62 + i * 4,
      grade: failed ? "F" : i === 0 ? "A" : i === 1 ? "B" : "C",
      passed: !failed,
      sessionId,
      attempt: 1,
    };
  });
  return {
    sessionId,
    level,
    status: "completed",
    courseResults,
    carryoverCourses: courseResults
      .filter((c) => !c.passed)
      .map((c) => c.courseCode),
  };
}

const LEVEL_PLAN: { level: StudentLevel; count: number }[] = [
  { level: "100 Level", count: 14 },
  { level: "200 Level", count: 12 },
  { level: "300 Level", count: 10 },
  { level: "400 Level", count: 8 },
];

function buildSeededStudents(): Student[] {
  const students: Student[] = [];
  let index = 0;

  for (const { level, count } of LEVEL_PLAN) {
    for (let i = 0; i < count; i++) {
      const failCount = failCountFor(index);
      // One deferred case (early in 100 Level) and one hold-for-review case
      // (mid 300 Level) — deliberately placed, not derived from failCount,
      // since those are administrative states rather than academic ones.
      const isDeferred = level === "100 Level" && i === 5;
      const holdForReview = level === "300 Level" && i === 4;

      students.push({
        id: `student-${index}`,
        studentId: studentIdFor(index),
        name: nameFor(index),
        programme: "B.Sc. Computer Science",
        department: "Department of Computer Science",
        currentLevel: level,
        currentSessionId: CURRENT_SESSION_ID,
        isGraduating: false,
        isDeferred,
        holdForReview,
        academicHistory: [
          buildAcademicRecord(level, CURRENT_SESSION_ID, failCount),
        ],
      });
      index++;
    }
  }

  return students;
}

const SEEDED_STUDENTS: Student[] = buildSeededStudents();

interface StudentsState {
  students: Student[];
  /** Bulk-apply a rollover's effects — see `src/store/rollover.store.ts`. Replaces the students array wholesale since every entry may change. */
  setStudents: (students: Student[]) => void;
}

export const useStudentsStore = create<StudentsState>()(
  persist(
    (set) => ({
      students: SEEDED_STUDENTS,
      setStudents: (students) => set({ students }),
    }),
    {
      name: "t-educare-students",
      version: 1,
      migrate: () => ({ students: SEEDED_STUDENTS }),
    },
  ),
);
