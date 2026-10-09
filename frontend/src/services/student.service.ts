import { apiClient } from "@/lib/axios";
import type {
  BloodGroup,
  CaseStatus,
  DisciplinaryActionType,
  Genotype,
  MaritalStatus,
  Religion,
  Student,
  StudentAcademicRecord,
  StudentCaseRecord,
  StudentDisciplinaryRecord,
  StudentGender,
  StudentStatus,
  StudentTitle,
} from "@/types/student";

export type StudentsListParams = {
  search?: string;
  schoolId?: string;
  facultyId?: string;
  departmentId?: string;
  programId?: string;
  programLevelId?: string;
  currentSessionId?: string;
  includeArchived?: boolean;
};

export type StudentFormPayload = {
  /** Omit/blank for a pre-student (no matric number assigned yet). */
  matricNo?: string;
  title: StudentTitle;
  firstName: string;
  middleName?: string;
  lastName: string;
  otherName?: string;
  gender: StudentGender;
  maritalStatus: MaritalStatus;
  email: string;
  phone: string;
  emergencyContact: string;
  dateOfBirth: string;
  religion: Religion;
  maidenName?: string;
  bloodGroup: BloodGroup;
  genotype: Genotype;
  weightKg: number;
  heightCm: number;
  nationality: string;
  stateOfOrigin: string;
  lga: string;
  residentAddress: string;
  avatarUrl?: string;
  schoolId: string;
  facultyId: string;
  departmentId: string;
  programId: string;
  programLevelId: string;
  currentSessionId: string;
  hostelName?: string;
  roomNumber?: string;
  allergies?: string;
  chronicConditions?: string;
  currentMedications?: string;
  pastSurgeries?: string;
  physicianName?: string;
  physicianPhone?: string;
  healthInsuranceProvider?: string;
  healthInsuranceNumber?: string;
  medicalNotes?: string;
};

export type UpdateStudentPayload = Partial<StudentFormPayload> & {
  status?: StudentStatus;
  isGraduating?: boolean;
  isDeferred?: boolean;
  holdForReview?: boolean;
};

export type AddAcademicRecordPayload = {
  academicSessionId: string;
  programLevelId: string;
  status: "completed" | "current" | "repeat";
  carryoverCourseIds?: string[];
};

export type RecordDisciplinaryActionPayload = {
  actionType: DisciplinaryActionType;
  reason: string;
  startDate?: string;
  endDate?: string;
};

export type ReportCasePayload = {
  title: string;
  description: string;
};

export type ResolveCasePayload = {
  status: CaseStatus;
  resolutionNotes?: string;
};

export const studentService = {
  async list(params: StudentsListParams = {}): Promise<Student[]> {
    const { data } = await apiClient.get<Student[]>("/students", {
      params: {
        search: params.search || undefined,
        schoolId: params.schoolId || undefined,
        facultyId: params.facultyId || undefined,
        departmentId: params.departmentId || undefined,
        programId: params.programId || undefined,
        programLevelId: params.programLevelId || undefined,
        currentSessionId: params.currentSessionId || undefined,
        includeArchived: params.includeArchived,
      },
    });
    return data;
  },

  async get(id: string): Promise<Student> {
    const { data } = await apiClient.get<Student>(`/students/${id}`);
    return data;
  },

  async create(payload: StudentFormPayload): Promise<Student> {
    const { data } = await apiClient.post<Student>("/students", payload);
    return data;
  },

  async update(id: string, payload: UpdateStudentPayload): Promise<Student> {
    const { data } = await apiClient.patch<Student>(`/students/${id}`, payload);
    return data;
  },

  async archive(id: string): Promise<Student> {
    const { data } = await apiClient.post<Student>(`/students/${id}/archive`);
    return data;
  },

  async restore(id: string): Promise<Student> {
    const { data } = await apiClient.post<Student>(`/students/${id}/restore`);
    return data;
  },

  async listAcademicHistory(
    studentId: string,
  ): Promise<StudentAcademicRecord[]> {
    const { data } = await apiClient.get<StudentAcademicRecord[]>(
      `/students/${studentId}/academic-history`,
    );
    return data;
  },

  async addAcademicRecord(
    studentId: string,
    payload: AddAcademicRecordPayload,
  ): Promise<StudentAcademicRecord> {
    const { data } = await apiClient.post<StudentAcademicRecord>(
      `/students/${studentId}/academic-history`,
      payload,
    );
    return data;
  },

  async listDisciplinaryRecords(
    studentId: string,
  ): Promise<StudentDisciplinaryRecord[]> {
    const { data } = await apiClient.get<StudentDisciplinaryRecord[]>(
      `/students/${studentId}/disciplinary-records`,
    );
    return data;
  },

  async recordDisciplinaryAction(
    studentId: string,
    payload: RecordDisciplinaryActionPayload,
  ): Promise<StudentDisciplinaryRecord> {
    const { data } = await apiClient.post<StudentDisciplinaryRecord>(
      `/students/${studentId}/disciplinary-records`,
      payload,
    );
    return data;
  },

  async listCases(studentId: string): Promise<StudentCaseRecord[]> {
    const { data } = await apiClient.get<StudentCaseRecord[]>(
      `/students/${studentId}/cases`,
    );
    return data;
  },

  async reportCase(
    studentId: string,
    payload: ReportCasePayload,
  ): Promise<StudentCaseRecord> {
    const { data } = await apiClient.post<StudentCaseRecord>(
      `/students/${studentId}/cases`,
      payload,
    );
    return data;
  },

  async resolveCase(
    studentId: string,
    caseId: string,
    payload: ResolveCasePayload,
  ): Promise<StudentCaseRecord> {
    const { data } = await apiClient.patch<StudentCaseRecord>(
      `/students/${studentId}/cases/${caseId}`,
      payload,
    );
    return data;
  },
};
