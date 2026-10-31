import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  hostelAllocationService,
  hostelService,
  type AddHostelAllocationPayload,
  type AssignRoomPayload,
  type HostelFormPayload,
} from "@/services/hostel.service";

const HOSTELS_KEY = "hostels";
const ALLOCATIONS_KEY = "hostel-allocations";

export function useHostels() {
  return useQuery({
    queryKey: [HOSTELS_KEY],
    queryFn: () => hostelService.list(),
  });
}

function useInvalidateHostels() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [HOSTELS_KEY] });
    queryClient.invalidateQueries({ queryKey: [ALLOCATIONS_KEY] });
  };
}

export function useCreateHostel() {
  const invalidate = useInvalidateHostels();
  return useMutation({
    mutationFn: (payload: HostelFormPayload) => hostelService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateHostel() {
  const invalidate = useInvalidateHostels();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: HostelFormPayload }) =>
      hostelService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useDownloadHostelsTemplate() {
  return useMutation({
    mutationFn: () => hostelService.downloadTemplate(),
  });
}

export function useImportHostels() {
  const invalidate = useInvalidateHostels();
  return useMutation({
    mutationFn: (file: File) => hostelService.importCsv(file),
    onSuccess: invalidate,
  });
}

export function useHostelRoster(
  hostelId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [HOSTELS_KEY, "roster", hostelId],
    queryFn: () => hostelService.roster(hostelId!),
    enabled: (options.enabled ?? true) && !!hostelId,
  });
}

export function useHostelAllocations(status?: string) {
  return useQuery({
    queryKey: [ALLOCATIONS_KEY, status ?? "all"],
    queryFn: () => hostelAllocationService.list(status),
  });
}

function useInvalidateAllocations() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [ALLOCATIONS_KEY] });
    queryClient.invalidateQueries({ queryKey: [HOSTELS_KEY] });
  };
}

export function useAddHostelAllocation() {
  const invalidate = useInvalidateAllocations();
  return useMutation({
    mutationFn: (payload: AddHostelAllocationPayload) =>
      hostelAllocationService.addStudent(payload),
    onSuccess: invalidate,
  });
}

export function useProposeAllocation() {
  const invalidate = useInvalidateAllocations();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignRoomPayload }) =>
      hostelAllocationService.propose(id, payload),
    onSuccess: invalidate,
  });
}

export function useConfirmAllocation() {
  const invalidate = useInvalidateAllocations();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignRoomPayload }) =>
      hostelAllocationService.confirm(id, payload),
    onSuccess: invalidate,
  });
}

export function useMoveAllocationToWaitlist() {
  const invalidate = useInvalidateAllocations();
  return useMutation({
    mutationFn: (id: string) => hostelAllocationService.moveToWaitlist(id),
    onSuccess: invalidate,
  });
}

export function useRemoveAllocation() {
  const invalidate = useInvalidateAllocations();
  return useMutation({
    mutationFn: (id: string) => hostelAllocationService.remove(id),
    onSuccess: invalidate,
  });
}

export function useBulkUploadAllocationsTemplate() {
  return useMutation({
    mutationFn: () => hostelAllocationService.bulkUploadTemplate(),
  });
}

export function useBulkUploadAllocations() {
  const invalidate = useInvalidateAllocations();
  return useMutation({
    mutationFn: (file: File) => hostelAllocationService.bulkUpload(file),
    onSuccess: invalidate,
  });
}
