import Image from "next/image";
import { Logo } from "@/components/shared/logo";

export function AuthHeroPanel() {
  return (
    <div className="relative hidden w-5/12 shrink-0 flex-col overflow-hidden bg-white lg:flex">
      <div className="absolute inset-x-0 top-0 z-0 h-[47%] bg-primary" />
      <div className="pointer-events-none absolute -top-24 -right-24 z-0 size-72 rounded-full bg-secondary/50 blur-3xl" />

      <div className="relative z-10 px-10 pt-10">
        <div className="relative inline-flex animate-in fade-in slide-in-from-left-8 duration-700">
          <Logo variant="light" size="md" priority />
          <span
            aria-hidden
            className="absolute -top-2.5 left-6 flex size-5 items-center justify-center rounded-full bg-[#8B5CF6] text-[10px] font-semibold text-white ring-2 ring-primary"
          >
            S
          </span>
        </div>

        <p className="mt-6 max-w-[88%] text-sm leading-relaxed text-white/90 animate-in fade-in slide-in-from-left-8 duration-700 delay-100 fill-mode-both">
          Welcome back — sign in to check your courses, results, hostel status,
          and settle your bills, all in one place.
        </p>
      </div>

      <div className="relative z-10 mt-8 flex justify-end pr-6 animate-in fade-in zoom-in-95 duration-700 delay-200 fill-mode-both">
        <div className="w-[76%] max-w-96 animate-float-slow">
          <Image
            src="/img.png"
            alt="Student reviewing coursework on campus"
            width={640}
            height={463}
            priority
            className="h-auto w-full drop-shadow-2xl"
          />
        </div>
      </div>

      <div className="relative z-10 mt-6 flex flex-1 flex-col justify-end gap-4 pb-8 animate-in fade-in duration-700 delay-300 fill-mode-both">
        <Image
          src="/auth-hero-illustration.svg"
          alt=""
          aria-hidden
          width={220}
          height={77}
          className="h-auto w-160"
        />
        <div className="h-0.5 w-2/3 bg-primary" />
      </div>
    </div>
  );
}
