export interface HostelRoom {
  id: string;
  roomNumber: string;
  capacity: number;
  occupiedCount: number;
}

export interface Hostel {
  id: string;
  name: string;
  photoUrl: string | null;
  totalRooms: number;
  totalBedspaces: number;
  occupiedCount: number;
  rooms: HostelRoom[];
  createdAt: string;
}

export interface HostelRosterStudent {
  studentId: string;
  matricNo: string;
  studentName: string;
  departmentName: string;
  roomNumber: string | null;
}

export type HostelAllocationStatus =
  "PENDING_ALLOCATION" | "ALLOCATED" | "WAITLIST";

/** Enriched — matches the backend's `HostelAllocationResponse` so the table never needs a separate lookup. `hostelId`/`hostelName`/`roomId`/`roomNumber` are null while WAITLIST. */
export interface HostelAllocation {
  id: string;
  studentId: string;
  studentMatricNo: string;
  studentName: string;
  departmentName: string;
  hostelId: string | null;
  hostelName: string | null;
  roomId: string | null;
  roomNumber: string | null;
  status: HostelAllocationStatus;
  createdAt: string;
}
