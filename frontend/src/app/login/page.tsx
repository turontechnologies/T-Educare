import type { Metadata } from "next";
import Image from "next/image";
import { AuthHeroPanel } from "@/components/features/auth/auth-hero-panel";
import { LoginForm } from "@/components/features/auth/login-form";
import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AuthHeroPanel />

      <div className="relative flex flex-1 flex-col overflow-hidden bg-muted">
        <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 sm:px-10">
          <Image
            src="/form-bg.svg"
            alt=""
            aria-hidden
            width={705}
            height={522}
            className="pointer-events-none absolute top-1/2 left-1/2 z-0 w-176 max-w-none -translate-x-1/2 -translate-y-1/2 opacity-70"
          />

          <div className="relative z-10 w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col items-center gap-1 text-center">
              <Logo variant="dark" size="lg" showWordmark={false} priority />
              <h1 className="mt-3 text-2xl font-semibold text-primary">
                Student Portal
              </h1>
            </div>

            <div className="mt-10">
              <LoginForm />
            </div>
          </div>
        </div>

        <footer className="relative z-10 pb-6 text-center text-xs text-muted-foreground">
          Copyright &copy; {new Date().getFullYear()}. All Rights Reserved -
          Powered by Turon Technologies Limited.
        </footer>
      </div>
    </div>
  );
}
