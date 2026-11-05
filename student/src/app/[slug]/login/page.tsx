import { InstitutionLoginScreen } from "@/components/features/auth/institution-login-screen";

export default async function StudentLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <InstitutionLoginScreen slug={slug} />;
}
