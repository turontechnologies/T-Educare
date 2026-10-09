import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  institutionService,
  type InstitutionFormPayload,
  type InstitutionsListParams,
  type LicensePayload,
  type RenewLicensePayload,
  type StartGracePeriodPayload,
} from "@/services/institution.service";
import type { InstitutionStatus } from "@/types/institution";

const institutionsKey = (params: InstitutionsListParams) => [
  "institutions",
  params,
];

/** Fetches the full institutions list (large perPage — see institutions.store.ts for why). */
export function useInstitutions(
  params: InstitutionsListParams = {},
  options: { enabled?: boolean; refetchInterval?: number | false } = {},
) {
  return useQuery({
    queryKey: institutionsKey(params),
    queryFn: () => institutionService.list(params),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? false,
  });
}

export function useCreateInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InstitutionFormPayload) =>
      institutionService.create(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["institutions"] }),
  });
}

export function useUpdateInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<InstitutionFormPayload>;
    }) => institutionService.update(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["institutions"] }),
  });
}

export function useUpdateInstitutionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InstitutionStatus }) =>
      institutionService.updateStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["institutions"] }),
  });
}

export function useArchiveInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => institutionService.archive(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["institutions"] }),
  });
}

export function useRestoreInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => institutionService.restore(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["institutions"] }),
  });
}

export function useLinkModules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, moduleKeys }: { id: string; moduleKeys: string[] }) =>
      institutionService.linkModules(id, moduleKeys),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["institutions"] }),
  });
}

export function useSaveLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LicensePayload }) =>
      institutionService.saveLicense(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["institutions"] }),
  });
}

export function useRegenerateLicenseKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => institutionService.regenerateLicenseKey(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["institutions"] }),
  });
}

export function useRevokeLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => institutionService.revokeLicense(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["institutions"] }),
  });
}

export function useStartGracePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: StartGracePeriodPayload;
    }) => institutionService.startGracePeriod(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      // Otherwise a history dialog reopened without a full page reload can
      // briefly show the list cached from before this mutation.
      queryClient.invalidateQueries({ queryKey: ["license-events", id] });
    },
  });
}

export function useRenewLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload?: RenewLicensePayload;
    }) => institutionService.renewLicense(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      queryClient.invalidateQueries({ queryKey: ["license-events", id] });
    },
  });
}

/** Fetched on demand (dialog open), not hydrated globally — this is a rarely-viewed audit trail, not nav-critical state. */
export function useLicenseEvents(
  institutionId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["license-events", institutionId],
    queryFn: () => institutionService.listLicenseEvents(institutionId!),
    enabled: (options.enabled ?? true) && !!institutionId,
  });
}
