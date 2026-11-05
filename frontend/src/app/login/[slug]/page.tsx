import { AuthHeroPanel } from "@/components/features/auth/auth-hero-panel";
import { InstitutionLoginScreen } from "@/components/features/auth/institution-login-screen";

export default async function InstitutionLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AuthHeroPanel />

      <div className="relative flex flex-1 flex-col overflow-hidden bg-muted">
        <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 sm:px-10">
          <InstitutionLoginScreen slug={slug} />
        </div>

        <footer className="relative z-10 pb-6 text-center text-xs text-muted-foreground">
          Copyright &copy; {new Date().getFullYear()}. All Rights Reserved -
          Powered by Turon Technologies Limited.
        </footer>
      </div>
    </div>
  );
}
