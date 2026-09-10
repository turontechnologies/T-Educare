export interface PlatformModule {
  key: string;
  label: string;
}

/** The full set of platform features a super admin can activate per institution — see the "Link New Institution" dialog on `/super-admin/modules`. */
export const PLATFORM_MODULES: PlatformModule[] = [
  { key: "payment", label: "Payment module" },
  { key: "students", label: "Students" },
  { key: "lecturer", label: "Lecturer" },
  { key: "exams", label: "Exams" },
  { key: "results", label: "Results" },
  { key: "reports", label: "Reports" },
  { key: "sms-integration", label: "SMS Integration" },
  { key: "ussd-services", label: "USSD Services" },
  { key: "hotels", label: "Hotels" },
  { key: "accommodations", label: "Accommodations" },
  { key: "registration", label: "Registration" },
  { key: "faculty", label: "Faculty" },
  { key: "department", label: "Department" },
  { key: "school", label: "School" },
  { key: "courses", label: "Courses" },
  { key: "transport", label: "Transport" },
  { key: "referral-application", label: "Referral Application" },
  { key: "resit-module", label: "Resit Module" },
  { key: "admission", label: "Admission" },
];
