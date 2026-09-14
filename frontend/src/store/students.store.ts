import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SEED_SCHOOL_IDS } from "@/store/schools.store";
import { BLOOD_GROUPS } from "@/types/student";
import type {
  CourseResult,
  Student,
  StudentAcademicRecord,
  StudentLevel,
} from "@/types/student";

const CURRENT_SESSION_ID = "session-2025-2026";

/** 100/200/300/400 Level cohorts are 1/2/3/4 years into the programme respectively — admitted that many September intakes before the current session. */
const PROGRAMME_LEVEL_ORDER: StudentLevel[] = [
  "100 Level",
  "200 Level",
  "300 Level",
  "400 Level",
];

function admissionDateFor(level: StudentLevel) {
  const tierIndex = PROGRAMME_LEVEL_ORDER.indexOf(level);
  const admissionYear = 2025 - (tierIndex === -1 ? 0 : tierIndex);
  return new Date(`${admissionYear}-09-01T00:00:00.000Z`).toISOString();
}

function genderFor(index: number): Student["gender"] {
  return index % 2 === 0 ? "Male" : "Female";
}

function emailFor(firstName: string, lastName: string, index: number) {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@student.xyzcollege.edu.ng`;
}

function phoneFor(index: number) {
  return `0803${String(1000000 + index * 7).slice(-7)}`;
}

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

const STATE_LGA_PAIRS = [
  { state: "Lagos", lga: "Ikeja" },
  { state: "Ogun", lga: "Abeokuta North" },
  { state: "Oyo", lga: "Ibadan North" },
  { state: "Kaduna", lga: "Kaduna North" },
  { state: "Rivers", lga: "Port Harcourt" },
  { state: "Enugu", lga: "Enugu East" },
  { state: "Kano", lga: "Nasarawa" },
  { state: "Edo", lga: "Oredo" },
  { state: "Delta", lga: "Warri South" },
  { state: "Anambra", lga: "Awka South" },
];

/** Pure/deterministic — no `Math.random`, so the roster is identical on every reload rather than a fresh random draw. */
function firstNameFor(index: number) {
  return FIRST_NAMES[index % FIRST_NAMES.length];
}
function lastNameFor(index: number) {
  return LAST_NAMES[index % LAST_NAMES.length];
}
function middleNameFor(index: number) {
  return FIRST_NAMES[(index + 7) % FIRST_NAMES.length];
}
function otherNameFor(index: number) {
  return index % 4 === 0
    ? FIRST_NAMES[(index + 15) % FIRST_NAMES.length]
    : undefined;
}

function matricNoFor(index: number) {
  return `UL-${String(10000 + index)}`;
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

/** The rich demographic fields shared by every seeded student — deterministic from index alone. */
function demographicsFor(
  index: number,
): Pick<
  Student,
  | "matricNo"
  | "title"
  | "firstName"
  | "middleName"
  | "lastName"
  | "otherName"
  | "gender"
  | "maritalStatus"
  | "email"
  | "phone"
  | "emergencyContact"
  | "dateOfBirth"
  | "religion"
  | "maidenName"
  | "bloodGroup"
  | "genotype"
  | "weightKg"
  | "heightCm"
  | "nationality"
  | "stateOfOrigin"
  | "lga"
  | "residentAddress"
> {
  const gender = genderFor(index);
  const firstName = firstNameFor(index);
  const lastName = lastNameFor(index);
  const maritalStatus = index % 17 === 0 ? "Married" : "Single";
  const { state, lga } = STATE_LGA_PAIRS[index % STATE_LGA_PAIRS.length];
  const birthYear = 2025 - PROGRAMME_LEVEL_ORDER.length - 15 - (index % 3);

  return {
    matricNo: matricNoFor(index),
    title: gender === "Male" ? "Mr" : index % 2 === 0 ? "Miss" : "Mrs",
    firstName,
    middleName: middleNameFor(index),
    lastName,
    otherName: otherNameFor(index),
    gender,
    maritalStatus,
    email: emailFor(firstName, lastName, index),
    phone: phoneFor(index),
    emergencyContact: phoneFor(index + 500),
    dateOfBirth: new Date(`${birthYear}-03-15T00:00:00.000Z`).toISOString(),
    religion: index % 3 === 0 ? "Islam" : "Christian",
    maidenName:
      maritalStatus === "Married" && gender === "Female"
        ? LAST_NAMES[(index + 3) % LAST_NAMES.length]
        : undefined,
    bloodGroup: BLOOD_GROUPS[index % BLOOD_GROUPS.length],
    genotype: index % 5 === 0 ? "AS" : "AA",
    weightKg: 50 + (index % 36),
    heightCm: 150 + (index % 41),
    nationality: "Nigeria",
    stateOfOrigin: state,
    lga,
    residentAddress: `${10 + index} ${lastName} Street, ${state}`,
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
        ...demographicsFor(index),
        avatarUrl: undefined,
        schoolId: SEED_SCHOOL_IDS.computing,
        faculty: "Faculty of Physical Sciences",
        programme: "B.Sc. Computer Science",
        department: "Department of Computer Science",
        currentLevel: level,
        currentSessionId: CURRENT_SESSION_ID,
        status: "active",
        isGraduating: false,
        isDeferred,
        holdForReview,
        academicHistory: [
          buildAcademicRecord(level, CURRENT_SESSION_ID, failCount),
        ],
        createdAt: admissionDateFor(level),
        archivedAt: null,
      });
      index++;
    }
  }

  // Two extra demo records beyond the 44 rollover-tested students above —
  // deliberately inactive/archived so they never enter a rollover draft
  // (see the `status === "active" && !archivedAt` filter in
  // `rollover.store.ts`'s `createDraft`) and don't disturb the verified
  // progression counts, while still giving the Student Management table a
  // realistic "View archived" / inactive-status case to show.
  students.push({
    id: `student-${index}`,
    ...demographicsFor(index),
    avatarUrl: undefined,
    schoolId: SEED_SCHOOL_IDS.computing,
    faculty: "Faculty of Physical Sciences",
    programme: "B.Sc. Computer Science",
    department: "Department of Computer Science",
    currentLevel: "200 Level",
    currentSessionId: CURRENT_SESSION_ID,
    status: "inactive",
    isGraduating: false,
    isDeferred: false,
    holdForReview: false,
    academicHistory: [buildAcademicRecord("200 Level", CURRENT_SESSION_ID, 0)],
    createdAt: admissionDateFor("200 Level"),
    archivedAt: null,
  });
  index++;

  students.push({
    id: `student-${index}`,
    ...demographicsFor(index),
    avatarUrl: undefined,
    schoolId: SEED_SCHOOL_IDS.engineering,
    faculty: "Faculty of Engineering",
    programme: "B.Eng. Mechanical Engineering",
    department: "Department of Mechanical Engineering",
    currentLevel: "100 Level",
    currentSessionId: CURRENT_SESSION_ID,
    status: "active",
    isGraduating: false,
    isDeferred: false,
    holdForReview: false,
    academicHistory: [buildAcademicRecord("100 Level", CURRENT_SESSION_ID, 0)],
    createdAt: admissionDateFor("100 Level"),
    archivedAt: new Date("2026-08-01T00:00:00.000Z").toISOString(),
  });

  return students;
}

const SEEDED_STUDENTS: Student[] = buildSeededStudents();

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

interface StudentsState {
  students: Student[];
  /** Bulk-apply a rollover's effects — see `src/store/rollover.store.ts`. Replaces the students array wholesale since every entry may change. */
  setStudents: (students: Student[]) => void;
  createStudent: (
    student: Omit<
      Student,
      "id" | "createdAt" | "archivedAt" | "academicHistory"
    >,
  ) => Student;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  archiveStudent: (id: string) => void;
  restoreStudent: (id: string) => void;
}

export const useStudentsStore = create<StudentsState>()(
  persist(
    (set) => ({
      students: SEEDED_STUDENTS,
      setStudents: (students) => set({ students }),

      createStudent: (student) => {
        const newStudent: Student = {
          ...student,
          id: makeId("student"),
          createdAt: new Date().toISOString(),
          archivedAt: null,
          academicHistory: [
            {
              sessionId: student.currentSessionId,
              level: student.currentLevel,
              status: "current",
              courseResults: [],
              carryoverCourses: [],
            },
          ],
        };
        set((state) => ({ students: [newStudent, ...state.students] }));
        return newStudent;
      },

      updateStudent: (id, patch) => {
        set((state) => ({
          students: state.students.map((student) =>
            student.id === id ? { ...student, ...patch } : student,
          ),
        }));
      },

      archiveStudent: (id) => {
        set((state) => ({
          students: state.students.map((student) =>
            student.id === id
              ? { ...student, archivedAt: new Date().toISOString() }
              : student,
          ),
        }));
      },

      restoreStudent: (id) => {
        set((state) => ({
          students: state.students.map((student) =>
            student.id === id ? { ...student, archivedAt: null } : student,
          ),
        }));
      },
    }),
    {
      name: "t-educare-students",
      version: 3,
      migrate: () => ({ students: SEEDED_STUDENTS }),
    },
  ),
);
