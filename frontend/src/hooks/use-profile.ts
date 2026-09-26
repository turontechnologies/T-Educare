import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  profileService,
  type ProfileResponse,
  type ProfileUpdatePayload,
} from "@/services/profile.service";
import { useAuthStore } from "@/store/auth.store";

export function useProfile() {
  return useQuery<ProfileResponse>({
    queryKey: ["profile"],
    queryFn: () => profileService.getProfile(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProfileUpdatePayload) =>
      profileService.updateProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
      // The header/sidebar read the *auth store's* snapshot of the user
      // (only ever set at login, or refreshed by useMe on a ~30s stale
      // window/refocus) — without this, a photo/name change showed up
      // instantly on the profile page itself but left the header stale
      // until the next refocus or reload. Merge the fresh fields in
      // immediately since we already have them, no extra round trip needed.
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({ ...currentUser, ...data.profile });
      }
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      profileService.updatePassword(payload),
  });
}
