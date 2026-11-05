"use client";

import { useState } from "react";
import { ArrowRight, Copy, KeyRound, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { NotchedField } from "@/components/shared/notched-field";
import { useSetStudentPassword } from "@/hooks/use-students";
import { fullName } from "@/lib/students";
import type { Student } from "@/types/student";

const PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generatePassword(length = 10) {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += PASSWORD_ALPHABET.charAt(
      Math.floor(Math.random() * PASSWORD_ALPHABET.length),
    );
  }
  return password;
}

interface SetStudentPasswordDialogProps {
  student?: Student;
  onOpenChange: (open: boolean) => void;
}

export function SetStudentPasswordDialog({
  student,
  onOpenChange,
}: SetStudentPasswordDialogProps) {
  return (
    <Dialog open={!!student} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Set Student Portal Password
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {student && (
          <SetStudentPasswordForm
            key={student.id}
            student={student}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SetStudentPasswordForm({
  student,
  onDone,
}: {
  student: Student;
  onDone: () => void;
}) {
  const setPassword = useSetStudentPassword();
  const [password, setPasswordValue] = useState("");

  const noMatricNo = !student.matricNo;

  const handleSubmit = async () => {
    if (noMatricNo) {
      toast.error(
        "Assign a matric number first — it doubles as this student's Portal username.",
      );
      return;
    }
    if (password.trim().length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await setPassword.mutateAsync({
        id: student.id,
        password: password.trim(),
      });
      toast.success(
        `Password set for ${fullName(student)} (${student.matricNo})`,
      );
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to set password",
      );
    }
  };

  return (
    <>
      <div className="space-y-5 p-6">
        <p className="text-sm text-muted-foreground">
          {fullName(student)}
          {student.matricNo ? ` (${student.matricNo})` : ""} will use this
          password to sign in to the Student Portal with their matric number.
        </p>

        {noMatricNo ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            This student has no matric number yet — assign one before setting a
            Portal password.
          </p>
        ) : (
          <NotchedField
            label="Password"
            labelClassName="bg-popover"
            placeholder="Type a password for this student"
            value={password}
            onChange={(event) => setPasswordValue(event.target.value)}
            endAdornment={
              <button
                type="button"
                onClick={() => {
                  const generated = generatePassword();
                  setPasswordValue(generated);
                  navigator.clipboard?.writeText(generated).catch(() => {});
                  toast.success("Generated a password and copied it");
                }}
                aria-label="Generate a password"
                title="Generate a password"
                className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
              >
                <KeyRound className="size-4" />
              </button>
            }
          />
        )}

        {password && (
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(password);
                toast.success("Copied to clipboard");
              } catch {
                toast.error("Couldn't copy — select and copy manually");
              }
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-secondary hover:underline"
          >
            <Copy className="size-3.5" />
            Copy password
          </button>
        )}
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          disabled={setPassword.isPending || noMatricNo}
          onClick={handleSubmit}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Set Password
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
