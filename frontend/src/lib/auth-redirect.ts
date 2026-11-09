import { useInstitutionsStore } from "@/store/institutions.store";
import type { AuthenticatedUser } from "@/types/auth";

/**
 * Where a signed-out session should land — an institution_admin whose
 * institution has a URL slug goes back to that institution's own scoped
 * login (`/login/{slug}`), never the generic `/login`, regardless of which
 * one they originally signed in from. Everyone else (super_admin, or no
 * resolvable slug yet) falls back to the generic page.
 */
export function resolveLoginPath(user: AuthenticatedUser | null): string {
  if (user?.role === "institution_admin" && user.institutionId) {
    const institution = useInstitutionsStore
      .getState()
      .institutions.find((i) => i.id === user.institutionId);
    if (institution?.slug) {
      return `/login/${institution.slug}`;
    }
  }
  return "/login";
}
