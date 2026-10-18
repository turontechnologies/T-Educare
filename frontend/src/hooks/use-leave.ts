import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  leaveService,
  type CreateLeaveRequestPayload,
  type LeaveTypeFormPayload,
} from "@/services/leave.service";

const TYPES_KEY = "leave-types";
const REQUESTS_KEY = "leave-requests";
const BALANCES_KEY = "leave-balances";
const MY_TYPES_KEY = "my-leave-types";
const MY_REQUESTS_KEY = "my-leave-requests";
const MY_BALANCE_KEY = "my-leave-balance";

// --- Admin: leave types ---

export function useLeaveTypes(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [TYPES_KEY],
    queryFn: () => leaveService.listTypes(),
    enabled: options.enabled ?? true,
  });
}

function useInvalidateTypes() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [TYPES_KEY] });
}

export function useCreateLeaveType() {
  const invalidate = useInvalidateTypes();
  return useMutation({
    mutationFn: (payload: LeaveTypeFormPayload) =>
      leaveService.createType(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateLeaveType() {
  const invalidate = useInvalidateTypes();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<LeaveTypeFormPayload>;
    }) => leaveService.updateType(id, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveLeaveType() {
  const invalidate = useInvalidateTypes();
  return useMutation({
    mutationFn: (id: string) => leaveService.archiveType(id),
    onSuccess: invalidate,
  });
}

export function useRestoreLeaveType() {
  const invalidate = useInvalidateTypes();
  return useMutation({
    mutationFn: (id: string) => leaveService.restoreType(id),
    onSuccess: invalidate,
  });
}

// --- Admin: requests & balances ---

export function useLeaveRequests(
  params: { status?: string; staffId?: string } = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [REQUESTS_KEY, params],
    queryFn: () => leaveService.listRequests(params),
    enabled: options.enabled ?? true,
  });
}

function useInvalidateRequests() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [REQUESTS_KEY] });
    queryClient.invalidateQueries({ queryKey: [BALANCES_KEY] });
    queryClient.invalidateQueries({ queryKey: ["attendance-overview"] });
    queryClient.invalidateQueries({ queryKey: ["attendance-trend"] });
  };
}

export function useApproveLeaveRequest() {
  const invalidate = useInvalidateRequests();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      leaveService.approve(id, note),
    onSuccess: invalidate,
  });
}

export function useRejectLeaveRequest() {
  const invalidate = useInvalidateRequests();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      leaveService.reject(id, note),
    onSuccess: invalidate,
  });
}

export function useLeaveBalances(
  year?: number,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [BALANCES_KEY, year],
    queryFn: () => leaveService.listBalances(year),
    enabled: options.enabled ?? true,
  });
}

// --- Self-service ---

export function useMyLeaveTypes(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [MY_TYPES_KEY],
    queryFn: () => leaveService.myTypes(),
    enabled: options.enabled ?? true,
  });
}

export function useMyLeaveRequests(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [MY_REQUESTS_KEY],
    queryFn: () => leaveService.myRequests(),
    enabled: options.enabled ?? true,
  });
}

function useInvalidateMyRequests() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [MY_REQUESTS_KEY] });
    queryClient.invalidateQueries({ queryKey: [MY_BALANCE_KEY] });
  };
}

export function useCreateMyLeaveRequest() {
  const invalidate = useInvalidateMyRequests();
  return useMutation({
    mutationFn: (payload: CreateLeaveRequestPayload) =>
      leaveService.createRequest(payload),
    onSuccess: invalidate,
  });
}

export function useCancelMyLeaveRequest() {
  const invalidate = useInvalidateMyRequests();
  return useMutation({
    mutationFn: (id: string) => leaveService.cancelRequest(id),
    onSuccess: invalidate,
  });
}

export function useSubmitResumption() {
  const invalidate = useInvalidateMyRequests();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      leaveService.submitResumption(id, note),
    onSuccess: invalidate,
  });
}

export function useMyLeaveBalance(
  year?: number,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [MY_BALANCE_KEY, year],
    queryFn: () => leaveService.myBalance(year),
    enabled: options.enabled ?? true,
  });
}
