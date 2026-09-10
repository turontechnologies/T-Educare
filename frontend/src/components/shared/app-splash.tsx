"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/shared/logo";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

const STEPS = [
  "Verifying your session…",
  "Loading your workspace…",
  "Preparing your dashboard…",
] as const;

/** Keeps the brand moment on screen even when hydration resolves instantly, so it never reads as a flash. */
const MIN_VISIBLE_MS = 1500;
const STEP_INTERVAL_MS = 550;
const EXIT_DURATION_MS = 400;

type Phase = "visible" | "leaving" | "done";

export function AppSplash({ children }: { children: ReactNode }) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("visible");

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
    }, STEP_INTERVAL_MS);
    return () => clearInterval(stepTimer);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    const minVisibleTimer = setTimeout(
      () => setPhase("leaving"),
      MIN_VISIBLE_MS,
    );
    return () => clearTimeout(minVisibleTimer);
  }, [hasHydrated]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const exitTimer = setTimeout(() => setPhase("done"), EXIT_DURATION_MS);
    return () => clearTimeout(exitTimer);
  }, [phase]);

  return (
    <>
      {phase !== "done" && (
        <div
          role="status"
          aria-live="polite"
          aria-hidden={phase === "leaving"}
          className={cn(
            "fixed inset-0 z-100 flex flex-col items-center justify-center gap-8 bg-linear-to-br from-primary via-primary to-secondary px-6 text-center transition-opacity ease-out",
            phase === "leaving"
              ? "pointer-events-none opacity-0 duration-400"
              : "opacity-100 duration-300",
          )}
        >
          <div className="animate-in zoom-in-95 fade-in duration-700">
            <Logo variant="light" size="lg" priority />
          </div>

          <div className="max-w-xs space-y-2">
            <p
              key={step}
              className="animate-in fade-in text-sm font-medium text-white duration-300"
            >
              {STEPS[step]}
            </p>
            <p className="text-xs leading-relaxed text-white/60">
              Your school management platform for students, teachers, and
              administrators.
            </p>
          </div>

          <div className="h-1 w-48 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-1/3 rounded-full bg-tertiary animate-progress-indeterminate" />
          </div>
        </div>
      )}
      {children}
    </>
  );
}
