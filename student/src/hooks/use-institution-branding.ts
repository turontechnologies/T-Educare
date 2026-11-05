import { useQuery } from "@tanstack/react-query";
import { studentAuthService } from "@/services/student-auth.service";

/** Public, unauthenticated — resolves an institution-scoped login URL's slug to its branding. Same endpoint the admin app's `/login/[slug]` reads. */
export function useInstitutionBranding(slug: string) {
  return useQuery({
    queryKey: ["institution-branding", slug],
    queryFn: () => studentAuthService.brandingBySlug(slug),
    retry: false,
    staleTime: 60_000,
  });
}
