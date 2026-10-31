import { apiClient } from "@/lib/axios";
import type {
  BulkHostelAllocationResult,
  Hostel,
  HostelAllocation,
  HostelRosterStudent,
} from "@/types/hostel";

export type HostelRoomPayload = {
  roomNumber: string;
  capacity: number;
};

export type HostelFormPayload = {
  name: string;
  rooms: HostelRoomPayload[];
  photoUrl?: string;
};

export type AddHostelAllocationPayload = {
  studentId: string;
  hostelId: string;
  roomId: string;
};

export type AssignRoomPayload = {
  hostelId: string;
  roomId: string;
};

export const hostelService = {
  async list(): Promise<Hostel[]> {
    const { data } = await apiClient.get<Hostel[]>("/hostels");
    return data;
  },

  async create(payload: HostelFormPayload): Promise<Hostel> {
    const { data } = await apiClient.post<Hostel>("/hostels", payload);
    return data;
  },

  async update(id: string, payload: HostelFormPayload): Promise<Hostel> {
    const { data } = await apiClient.patch<Hostel>(`/hostels/${id}`, payload);
    return data;
  },

  async roster(id: string): Promise<HostelRosterStudent[]> {
    const { data } = await apiClient.get<HostelRosterStudent[]>(
      `/hostels/${id}/roster`,
    );
    return data;
  },
};

export const hostelAllocationService = {
  async list(status?: string): Promise<HostelAllocation[]> {
    const { data } = await apiClient.get<HostelAllocation[]>(
      "/hostel-allocations",
      { params: status ? { status } : undefined },
    );
    return data;
  },

  async addStudent(
    payload: AddHostelAllocationPayload,
  ): Promise<HostelAllocation> {
    const { data } = await apiClient.post<HostelAllocation>(
      "/hostel-allocations",
      payload,
    );
    return data;
  },

  async propose(
    id: string,
    payload: AssignRoomPayload,
  ): Promise<HostelAllocation> {
    const { data } = await apiClient.post<HostelAllocation>(
      `/hostel-allocations/${id}/propose`,
      payload,
    );
    return data;
  },

  async confirm(
    id: string,
    payload: AssignRoomPayload,
  ): Promise<HostelAllocation> {
    const { data } = await apiClient.post<HostelAllocation>(
      `/hostel-allocations/${id}/confirm`,
      payload,
    );
    return data;
  },

  async moveToWaitlist(id: string): Promise<HostelAllocation> {
    const { data } = await apiClient.post<HostelAllocation>(
      `/hostel-allocations/${id}/waitlist`,
    );
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/hostel-allocations/${id}`);
  },

  async bulkUploadTemplate(): Promise<Blob> {
    const { data } = await apiClient.get(
      "/hostel-allocations/bulk-upload-template",
      { responseType: "blob" },
    );
    return data;
  },

  async bulkUpload(file: File): Promise<BulkHostelAllocationResult> {
    const formData = new FormData();
    formData.append("file", file);
    // apiClient's request interceptor (src/lib/axios.ts) strips the default
    // JSON Content-Type for any FormData body — same as course.service.ts.
    const { data } = await apiClient.post<BulkHostelAllocationResult>(
      "/hostel-allocations/bulk-upload",
      formData,
    );
    return data;
  },
};
