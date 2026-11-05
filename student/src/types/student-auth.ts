export interface StudentAuthProfile {
  id: string;
  matricNo: string;
  preAdmissionId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  institutionId: string;
  institutionName: string;
  institutionSlug: string | null;
  institutionLogoUrl: string | null;
  institutionBrandColor: string | null;
}

export interface StudentLoginRequest {
  matricNo: string;
  password: string;
  institutionSlug?: string;
}

export interface StudentLoginResponse {
  student: StudentAuthProfile;
  token: string;
}

/** Public, unauthenticated — just enough to brand an institution-scoped login screen (`/[slug]/login`). Same shape the admin app's `/login/[slug]` reads from the same backend endpoint. */
export interface InstitutionBranding {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  brandColor: string | null;
}
