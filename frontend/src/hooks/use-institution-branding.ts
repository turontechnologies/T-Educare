import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";

/** Public, unauthenticated — resolves an institution-scoped login URL's slug to its branding. Used by `/login/[slug]`. */
export function useInstitutionBranding(slug: string) {
  return useQuery({
    queryKey: ["institution-branding", slug],
    queryFn: () => authService.brandingBySlug(slug),
    retry: false,
    staleTime: 60_000,
  });
}
