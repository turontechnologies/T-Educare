import { create } from "zustand";

export interface DashboardStats {
  registeredStudents: number;
  applicants: number;
  lecturers: number;
  accumulatedProfit: number;
}

export type EnrollmentRange = "day" | "week" | "month";
export interface EnrollmentPoint {
  label: string;
  value: number;
}

export interface RecentStudent {
  id: string;
  name: string;
  registeredAt: string; // ISO
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

const SEEDED_STATS: DashboardStats = {
  registeredStudents: 48043,
  applicants: 158429,
  lecturers: 10238,
  accumulatedProfit: 1_248_043,
};

const SEEDED_ENROLLMENT: Record<EnrollmentRange, EnrollmentPoint[]> = {
  month: [
    { label: "Feb", value: 180 },
    { label: "Mar", value: 420 },
    { label: "Apr", value: 260 },
    { label: "May", value: 400 },
    { label: "Jun", value: 220 },
    { label: "Jul", value: 340 },
    { label: "Aug", value: 200 },
    { label: "Sep", value: 260 },
    { label: "Oct", value: 360 },
  ],
  week: [
    { label: "Mon", value: 60 },
    { label: "Tue", value: 90 },
    { label: "Wed", value: 70 },
    { label: "Thu", value: 110 },
    { label: "Fri", value: 95 },
    { label: "Sat", value: 50 },
    { label: "Sun", value: 40 },
  ],
  day: [
    { label: "6am", value: 8 },
    { label: "9am", value: 22 },
    { label: "12pm", value: 18 },
    { label: "3pm", value: 26 },
    { label: "6pm", value: 14 },
    { label: "9pm", value: 6 },
  ],
};

const SEEDED_RECENT_STUDENTS: RecentStudent[] = [
  { id: "rs-1", name: "Amaka Chukwu", registeredAt: hoursAgo(2) },
  { id: "rs-2", name: "Daniel Okafor", registeredAt: hoursAgo(3) },
  { id: "rs-3", name: "Fatima Bello", registeredAt: hoursAgo(20) },
  { id: "rs-4", name: "Michael Adeyemi", registeredAt: hoursAgo(23) },
];

interface DashboardState {
  stats: DashboardStats;
  enrollment: Record<EnrollmentRange, EnrollmentPoint[]>;
  recentStudents: RecentStudent[];
  /** Swap the seed for real data — call after fetching `GET /dashboard/stats` (see backend/API_CONTRACT.md). */
  setStats: (stats: DashboardStats) => void;
  setEnrollment: (
    enrollment: Record<EnrollmentRange, EnrollmentPoint[]>,
  ) => void;
  setRecentStudents: (students: RecentStudent[]) => void;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  stats: SEEDED_STATS,
  enrollment: SEEDED_ENROLLMENT,
  recentStudents: SEEDED_RECENT_STUDENTS,
  setStats: (stats) => set({ stats }),
  setEnrollment: (enrollment) => set({ enrollment }),
  setRecentStudents: (students) => set({ recentStudents: students }),
}));
