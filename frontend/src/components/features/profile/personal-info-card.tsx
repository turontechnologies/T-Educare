"use client";

import { useForm } from "react-hook-form";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotchedField } from "@/components/shared/notched-field";

export interface PersonalInfoFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface PersonalInfoCardProps {
  defaultValues: PersonalInfoFormValues;
  onSave: (values: PersonalInfoFormValues) => void;
}

/** Shared "Personal Information" editor — same on both profile pages, just wired to a different store by the caller. */
export function PersonalInfoCard({
  defaultValues,
  onSave,
}: PersonalInfoCardProps) {
  const { register, handleSubmit, formState } = useForm<PersonalInfoFormValues>(
    { values: defaultValues },
  );

  const onSubmit = (values: PersonalInfoFormValues) => {
    onSave(values);
    toast.success("Profile updated");
  };

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both delay-75 duration-500">
      <CardHeader>
        <CardTitle className="text-primary">Personal Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-5 sm:grid-cols-2"
        >
          <NotchedField
            label="First Name"
            placeholder="e.g. Ada"
            {...register("firstName", { required: true })}
          />
          <NotchedField
            label="Last Name"
            placeholder="e.g. Okoye"
            {...register("lastName", { required: true })}
          />
          <NotchedField
            label="Email Address"
            type="email"
            placeholder="e.g. ada.okoye@turontech.com"
            {...register("email", { required: true })}
          />
          <NotchedField
            label="Phone Number"
            placeholder="e.g. 08012345678"
            {...register("phone", { required: true })}
          />
          <div className="flex justify-end sm:col-span-2">
            <Button
              type="submit"
              disabled={formState.isSubmitting}
              className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Save Changes
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
