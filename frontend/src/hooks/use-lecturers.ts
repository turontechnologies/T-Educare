import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  lecturerService,
  type LecturerFormPayload,
} from "@/services/lecturer.service";

const LECTURERS_KEY = "lecturers";

export function useLecturers(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [LECTURERS_KEY],
    queryFn: () => lecturerService.list({ includeArchived: true }),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

function useInvalidateLecturers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [LECTURERS_KEY] });
}

export function useCreateLecturer() {
  const invalidate = useInvalidateLecturers();
  return useMutation({
    mutationFn: (payload: LecturerFormPayload) =>
      lecturerService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateLecturer() {
  const invalidate = useInvalidateLecturers();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<LecturerFormPayload>;
    }) => lecturerService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveLecturer() {
  const invalidate = useInvalidateLecturers();
  return useMutation({
    mutationFn: (id: string) => lecturerService.archive(id),
    onSuccess: invalidate,
  });
}

export function useRestoreLecturer() {
  const invalidate = useInvalidateLecturers();
  return useMutation({
    mutationFn: (id: string) => lecturerService.restore(id),
    onSuccess: invalidate,
  });
}

export function useImportLecturers() {
  const invalidate = useInvalidateLecturers();
  return useMutation({
    mutationFn: (file: File) => lecturerService.importCsv(file),
    onSuccess: invalidate,
  });
}

export function useExportLecturers() {
  return useMutation({
    mutationFn: (includeArchived: boolean) =>
      lecturerService.exportCsv(includeArchived),
  });
}
