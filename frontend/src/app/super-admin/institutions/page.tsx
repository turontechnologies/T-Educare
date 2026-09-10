"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { useInstitutionsStore } from "@/store/institutions.store";

interface AddInstitutionForm {
  name: string;
  modulesCount: string;
}

const dateLabel = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format;

export default function InstitutionsPage() {
  const institutions = useInstitutionsStore((state) => state.institutions);
  const createInstitution = useInstitutionsStore(
    (state) => state.createInstitution,
  );
  const deleteInstitution = useInstitutionsStore(
    (state) => state.deleteInstitution,
  );
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, formState } =
    useForm<AddInstitutionForm>({
      defaultValues: { name: "", modulesCount: "" },
    });

  const onSubmit = (values: AddInstitutionForm) => {
    createInstitution({
      name: values.name.trim(),
      modulesCount: Number(values.modulesCount) || 0,
      studentCount: 0,
      revenue: 0,
      status: "active",
    });
    toast.success(`${values.name.trim()} added`);
    reset();
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Institutions"]} />

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-primary">All Institutions</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button className="gap-1.5 rounded-full transition-transform hover:scale-[1.03] active:scale-[0.98]" />
              }
            >
              <Plus className="size-4" />
              Add Institution
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Institution</DialogTitle>
              </DialogHeader>
              <form
                id="add-institution-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="name">Institution name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Lagos State Polytechnic"
                    {...register("name", { required: true })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="modulesCount">Number of modules</Label>
                  <Input
                    id="modulesCount"
                    type="number"
                    min={0}
                    placeholder="e.g. 8"
                    {...register("modulesCount", { required: true })}
                  />
                </div>
              </form>
              <DialogFooter>
                <Button
                  type="submit"
                  form="add-institution-form"
                  disabled={formState.isSubmitting}
                  className="rounded-full"
                >
                  Add Institution
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name of Institution</TableHead>
                <TableHead>Modules</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutions.map((institution) => (
                <TableRow
                  key={institution.id}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="font-medium">
                    {institution.name}
                  </TableCell>
                  <TableCell>{institution.modulesCount}</TableCell>
                  <TableCell>
                    {institution.studentCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateLabel(new Date(institution.createdAt))}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium capitalize",
                        institution.status === "active"
                          ? "text-emerald-600"
                          : "text-destructive",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          institution.status === "active"
                            ? "bg-emerald-500"
                            : "bg-destructive",
                        )}
                      />
                      {institution.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      aria-label={`Delete ${institution.name}`}
                      onClick={() => {
                        deleteInstitution(institution.id);
                        toast.success(`${institution.name} removed`);
                      }}
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
