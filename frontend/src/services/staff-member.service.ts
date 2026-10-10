import { apiClient } from "@/lib/axios";
import type {
  StaffDisciplinaryActionType,
  StaffDisciplinaryRecord,
  StaffGender,
  StaffMaritalStatus,
  StaffMember,
} from "@/types/staff-member";
import type { StaffQualification } from "@/types/staff-qualification";

export type StaffMembersListParams = {
  departmentId?: string;
  search?: string;
  includeArchived?: boolean;
};

export type StaffMemberFormPayload = {
  staffId: string;
  roleId: string;
  designationId: string;
  departmentId: string;
  gender: StaffGender;
  firstName: string;
  middleName?: string;
  lastName: string;
  otherName?: string;
  maritalStatus: StaffMaritalStatus;
  email: string;
  phone: string;
  emergencyContact: string;
  dateOfBirth: string;
  employmentStartDate: string;
  contactAddress: string;
  avatarUrl?: string;
  salaryAmount?: number;
  salaryCurrency?: string;
};

export type RecordStaffDisciplinaryActionPayload = {
  actionType: StaffDisciplinaryActionType;
  reason: string;
  startDate?: string;
  endDate?: string;
};

export type AddStaffQualificationPayload = {
  degree: string;
  fieldOfStudy: string;
  institutionAttended: string;
  yearObtained?: number;
};

export interface StaffImportResult {
  imported: number;
  skipped: number;
}

export const staffMemberService = {
  async list(params: StaffMembersListParams = {}): Promise<StaffMember[]> {
    const { data } = await apiClient.get<StaffMember[]>("/staff-members", {
      params: {
        departmentId: params.departmentId || undefined,
        search: params.search || undefined,
        includeArchived: params.includeArchived,
      },
    });
    return data;
  },

  async get(id: string): Promise<StaffMember> {
    const { data } = await apiClient.get<StaffMember>(`/staff-members/${id}`);
    return data;
  },

  async create(payload: StaffMemberFormPayload): Promise<StaffMember> {
    const { data } = await apiClient.post<StaffMember>(
      "/staff-members",
      payload,
    );
    return data;
  },

  async update(
    id: string,
    payload: Partial<StaffMemberFormPayload>,
  ): Promise<StaffMember> {
    const { data } = await apiClient.patch<StaffMember>(
      `/staff-members/${id}`,
      payload,
    );
    return data;
  },

  async archive(id: string): Promise<StaffMember> {
    const { data } = await apiClient.post<StaffMember>(
      `/staff-members/${id}/archive`,
    );
    return data;
  },

  async restore(id: string): Promise<StaffMember> {
    const { data } = await apiClient.post<StaffMember>(
      `/staff-members/${id}/restore`,
    );
    return data;
  },

  async listDisciplinaryRecords(
    staffId: string,
  ): Promise<StaffDisciplinaryRecord[]> {
    const { data } = await apiClient.get<StaffDisciplinaryRecord[]>(
      `/staff-members/${staffId}/disciplinary-records`,
    );
    return data;
  },

  async recordDisciplinaryAction(
    staffId: string,
    payload: RecordStaffDisciplinaryActionPayload,
  ): Promise<StaffDisciplinaryRecord> {
    const { data } = await apiClient.post<StaffDisciplinaryRecord>(
      `/staff-members/${staffId}/disciplinary-records`,
      payload,
    );
    return data;
  },

  async listQualifications(staffId: string): Promise<StaffQualification[]> {
    const { data } = await apiClient.get<StaffQualification[]>(
      `/staff-members/${staffId}/qualifications`,
    );
    return data;
  },

  async addQualification(
    staffId: string,
    payload: AddStaffQualificationPayload,
  ): Promise<StaffQualification> {
    const { data } = await apiClient.post<StaffQualification>(
      `/staff-members/${staffId}/qualifications`,
      payload,
    );
    return data;
  },

  async deleteQualification(
    staffId: string,
    qualificationId: string,
  ): Promise<void> {
    await apiClient.delete(
      `/staff-members/${staffId}/qualifications/${qualificationId}`,
    );
  },

  async import(file: File): Promise<StaffImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<StaffImportResult>(
      "/staff-members/import",
      formData,
    );
    return data;
  },

  async export(includeArchived = false): Promise<Blob> {
    const { data } = await apiClient.get("/staff-members/export", {
      params: { includeArchived },
      responseType: "blob",
    });
    return data;
  },
};
