import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  profileService,
  type ProfileResponse,
  type ProfileUpdatePayload,
} from "@/services/profile.service";

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
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      profileService.updatePassword(payload),
  });
}
