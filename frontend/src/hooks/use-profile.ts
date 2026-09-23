import { useQuery } from "@tanstack/react-query";

import {
  profileService,
  type ProfileResponse,
} from "@/services/profile.service";

export function useProfile() {
  return useQuery<ProfileResponse>({
    queryKey: ["profile"],
    queryFn: () => profileService.getProfile(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
