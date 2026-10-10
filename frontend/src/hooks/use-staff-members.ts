import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  staffMemberService,
  type AddStaffQualificationPayload,
  type StaffMemberFormPayload,
  type StaffMembersListParams,
} from "@/services/staff-member.service";

const STAFF_MEMBERS_KEY = "staff-members";

export function useStaffMembers(
  params: StaffMembersListParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [STAFF_MEMBERS_KEY, params],
    queryFn: () => staffMemberService.list(params),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

function useInvalidateStaffMembers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [STAFF_MEMBERS_KEY] });
}

export function useCreateStaffMember() {
  const invalidate = useInvalidateStaffMembers();
  return useMutation({
    mutationFn: (payload: StaffMemberFormPayload) =>
      staffMemberService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateStaffMember() {
  const invalidate = useInvalidateStaffMembers();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<StaffMemberFormPayload>;
    }) => staffMemberService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveStaffMember() {
  const invalidate = useInvalidateStaffMembers();
  return useMutation({
    mutationFn: (id: string) => staffMemberService.archive(id),
    onSuccess: invalidate,
  });
}

export function useRestoreStaffMember() {
  const invalidate = useInvalidateStaffMembers();
  return useMutation({
    mutationFn: (id: string) => staffMemberService.restore(id),
    onSuccess: invalidate,
  });
}

export function useImportStaffMembers() {
  const invalidate = useInvalidateStaffMembers();
  return useMutation({
    mutationFn: (file: File) => staffMemberService.import(file),
    onSuccess: invalidate,
  });
}

export function useExportStaffMembers() {
  return useMutation({
    mutationFn: (includeArchived: boolean) =>
      staffMemberService.export(includeArchived),
  });
}

export function useStaffQualifications(
  staffId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["staff-qualifications", staffId],
    queryFn: () => staffMemberService.listQualifications(staffId!),
    enabled: (options.enabled ?? true) && !!staffId,
  });
}

export function useAddStaffQualification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      staffId,
      payload,
    }: {
      staffId: string;
      payload: AddStaffQualificationPayload;
    }) => staffMemberService.addQualification(staffId, payload),
    onSuccess: (_data, { staffId }) =>
      queryClient.invalidateQueries({
        queryKey: ["staff-qualifications", staffId],
      }),
  });
}

export function useDeleteStaffQualification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      staffId,
      qualificationId,
    }: {
      staffId: string;
      qualificationId: string;
    }) => staffMemberService.deleteQualification(staffId, qualificationId),
    onSuccess: (_data, { staffId }) =>
      queryClient.invalidateQueries({
        queryKey: ["staff-qualifications", staffId],
      }),
  });
}
