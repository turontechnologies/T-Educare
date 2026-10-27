import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  announcementService,
  type AnnouncementFormPayload,
} from "@/services/announcement.service";
import type { AnnouncementTargetScope } from "@/types/announcement";

const ANNOUNCEMENTS_KEY = "announcements";

export function useAnnouncements(status?: string) {
  return useQuery({
    queryKey: [ANNOUNCEMENTS_KEY, status ?? "all"],
    queryFn: () => announcementService.list(status),
  });
}

export function useAnnouncementTargetOptions(
  scope: AnnouncementTargetScope | "",
) {
  return useQuery({
    queryKey: [ANNOUNCEMENTS_KEY, "targets", scope],
    queryFn: () =>
      announcementService.targetOptions(scope as AnnouncementTargetScope),
    enabled: !!scope,
  });
}

function useInvalidateAnnouncements() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_KEY] });
  };
}

export function useCreateAnnouncement() {
  const invalidate = useInvalidateAnnouncements();
  return useMutation({
    mutationFn: (payload: AnnouncementFormPayload) =>
      announcementService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateAnnouncement() {
  const invalidate = useInvalidateAnnouncements();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AnnouncementFormPayload;
    }) => announcementService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useSendAnnouncementNow() {
  const invalidate = useInvalidateAnnouncements();
  return useMutation({
    mutationFn: (id: string) => announcementService.sendNow(id),
    onSuccess: invalidate,
  });
}

export function useDeleteAnnouncement() {
  const invalidate = useInvalidateAnnouncements();
  return useMutation({
    mutationFn: (id: string) => announcementService.remove(id),
    onSuccess: invalidate,
  });
}
