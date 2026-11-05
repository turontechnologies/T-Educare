"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotchedField } from "@/components/shared/notched-field";
import { Logo } from "@/components/shared/logo";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function HomePage() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const handleContinue = (event: React.FormEvent) => {
    event.preventDefault();
    const slug = slugify(value);
    if (slug) {
      router.push(`/${slug}/login`);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted px-6 py-16">
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size="lg" priority />
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <GraduationCap className="size-4" />
            <span>Student Portal</span>
          </div>
        </div>

        <form onSubmit={handleContinue} className="mt-10 space-y-6">
          <NotchedField
            label="Your institution"
            placeholder="e.g. sams-university or your school's name"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoFocus
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!value.trim()}
              className="h-11 gap-2 rounded-full px-6 text-sm transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Use the sign-in link your institution shared with you, or enter its
          name above.
        </p>
      </div>

      <footer className="mt-16 text-center text-xs text-muted-foreground">
        Copyright &copy; {new Date().getFullYear()}. All Rights Reserved -
        Powered by Turon Technologies Limited.
      </footer>
    </div>
  );
}
