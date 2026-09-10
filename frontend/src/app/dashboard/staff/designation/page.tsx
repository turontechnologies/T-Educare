"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { useStaffStore, type StaffCategory } from "@/store/staff.store";

interface DesignationForm {
  name: string;
  description: string;
  category: StaffCategory;
}

export default function StaffDesignationPage() {
  const designations = useStaffStore((state) => state.designations);
  const createDesignation = useStaffStore((state) => state.createDesignation);
  const deleteDesignation = useStaffStore((state) => state.deleteDesignation);
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm<DesignationForm>({
    defaultValues: { name: "", description: "", category: "Academic Staff" },
  });

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Admin", "Staff Designation"]} />

      <div>
        <h1 className="text-xl font-semibold text-primary">
          Staff Designation
        </h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button className="mt-4 gap-1.5 rounded-full transition-transform hover:scale-[1.03] active:scale-[0.98]" />
            }
          >
            <Plus className="size-4" />
            Add New
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Designation</DialogTitle>
            </DialogHeader>
            <form
              id="add-designation-form"
              className="space-y-4"
              onSubmit={handleSubmit((values) => {
                createDesignation(values);
                toast.success(`${values.name} added`);
                reset();
                setOpen(false);
              })}
            >
              <div className="space-y-1.5">
                <Label htmlFor="designation-name">Designation</Label>
                <Input
                  id="designation-name"
                  placeholder="e.g. Registrar"
                  {...register("name", { required: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="designation-description">Description</Label>
                <Input
                  id="designation-description"
                  placeholder="e.g. Registrar"
                  {...register("description", { required: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="designation-category">Category</Label>
                <select
                  id="designation-category"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  {...register("category", { required: true })}
                >
                  <option value="Academic Staff">Academic Staff</option>
                  <option value="Non-Academic Staff">Non-Academic Staff</option>
                </select>
              </div>
            </form>
            <DialogFooter>
              <Button
                type="submit"
                form="add-designation-form"
                className="rounded-full"
              >
                Save Designation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S/N</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {designations.map((designation, index) => (
                <TableRow
                  key={designation.id}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {designation.name}
                  </TableCell>
                  <TableCell>{designation.description}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {designation.category}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        aria-label="Edit"
                        className="inline-flex size-7 items-center justify-center rounded-md text-secondary transition-colors hover:bg-secondary/10"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete"
                        onClick={() => {
                          deleteDesignation(designation.id);
                          toast.success(`${designation.name} removed`);
                        }}
                        className="inline-flex size-7 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            Showing 1 to {designations.length} of {designations.length} entries
          </p>
        </div>
      </div>
    </div>
  );
}
