"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { useAcademicsStore } from "@/store/academics.store";

interface SessionForm {
  session: string;
  from: string;
  to: string;
}

interface SemesterForm {
  session: string;
  name: string;
  description: string;
  from: string;
  to: string;
}

export default function SessionManagementPage() {
  const sessions = useAcademicsStore((state) => state.sessions);
  const semesters = useAcademicsStore((state) => state.semesters);
  const createSession = useAcademicsStore((state) => state.createSession);
  const deleteSession = useAcademicsStore((state) => state.deleteSession);
  const createSemester = useAcademicsStore((state) => state.createSemester);
  const deleteSemester = useAcademicsStore((state) => state.deleteSemester);

  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [semesterDialogOpen, setSemesterDialogOpen] = useState(false);

  const sessionForm = useForm<SessionForm>({
    defaultValues: { session: "", from: "", to: "" },
  });
  const semesterForm = useForm<SemesterForm>({
    defaultValues: { session: "", name: "", description: "", from: "", to: "" },
  });

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Admin", "Semester/Session"]} />

      <div>
        <h1 className="text-xl font-semibold text-primary">
          Session/Session Management
        </h1>

        <div className="mt-4 flex flex-wrap gap-2">
          <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
            <DialogTrigger
              render={
                <Button className="gap-1.5 rounded-full transition-transform hover:scale-[1.03] active:scale-[0.98]" />
              }
            >
              <Plus className="size-4" />
              Add New Session
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Session</DialogTitle>
              </DialogHeader>
              <form
                id="add-session-form"
                className="space-y-4"
                onSubmit={sessionForm.handleSubmit((values) => {
                  createSession(values);
                  toast.success(`Session ${values.session} added`);
                  sessionForm.reset();
                  setSessionDialogOpen(false);
                })}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="session">Session</Label>
                  <Input
                    id="session"
                    placeholder="e.g. 2024/2025"
                    {...sessionForm.register("session", { required: true })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="session-from">From</Label>
                    <Input
                      id="session-from"
                      placeholder="dd-mm-yyyy"
                      {...sessionForm.register("from", { required: true })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="session-to">To</Label>
                    <Input
                      id="session-to"
                      placeholder="dd-mm-yyyy"
                      {...sessionForm.register("to", { required: true })}
                    />
                  </div>
                </div>
              </form>
              <DialogFooter>
                <Button
                  type="submit"
                  form="add-session-form"
                  className="rounded-full"
                >
                  Save Session
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={semesterDialogOpen}
            onOpenChange={setSemesterDialogOpen}
          >
            <DialogTrigger
              render={
                <Button
                  variant="secondary"
                  className="gap-1.5 rounded-full transition-transform hover:scale-[1.03] active:scale-[0.98]"
                />
              }
            >
              <Plus className="size-4" />
              Add New Semester
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Semester</DialogTitle>
              </DialogHeader>
              <form
                id="add-semester-form"
                className="space-y-4"
                onSubmit={semesterForm.handleSubmit((values) => {
                  createSemester(values);
                  toast.success(`${values.name} added`);
                  semesterForm.reset();
                  setSemesterDialogOpen(false);
                })}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="semester-session">Session</Label>
                  <Input
                    id="semester-session"
                    placeholder="e.g. 2024/2025"
                    {...semesterForm.register("session", { required: true })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="semester-name">Semester name</Label>
                  <Input
                    id="semester-name"
                    placeholder="e.g. First Semester"
                    {...semesterForm.register("name", { required: true })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="semester-description">Description</Label>
                  <Input
                    id="semester-description"
                    placeholder="e.g. First Semester"
                    {...semesterForm.register("description", {
                      required: true,
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="semester-from">From</Label>
                    <Input
                      id="semester-from"
                      placeholder="dd-mm-yyyy"
                      {...semesterForm.register("from", { required: true })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="semester-to">To</Label>
                    <Input
                      id="semester-to"
                      placeholder="dd-mm-yyyy"
                      {...semesterForm.register("to", { required: true })}
                    />
                  </div>
                </div>
              </form>
              <DialogFooter>
                <Button
                  type="submit"
                  form="add-semester-form"
                  className="rounded-full"
                >
                  Save Semester
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="semester" className="mt-6">
          <TabsList variant="line">
            <TabsTrigger value="session">Session</TabsTrigger>
            <TabsTrigger value="semester">Semester</TabsTrigger>
          </TabsList>

          <TabsContent
            value="session"
            className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S/N</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session, index) => (
                  <TableRow key={session.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {session.session}
                    </TableCell>
                    <TableCell>{session.from}</TableCell>
                    <TableCell>{session.to}</TableCell>
                    <TableCell className="text-right">
                      <RowActions
                        onDelete={() => {
                          deleteSession(session.id);
                          toast.success(`Session ${session.session} removed`);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">
              Showing 1 to {sessions.length} of {sessions.length} entries
            </p>
          </TabsContent>

          <TabsContent
            value="semester"
            className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S/N</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Semester Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {semesters.map((semester, index) => (
                  <TableRow key={semester.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {semester.session}
                    </TableCell>
                    <TableCell>{semester.name}</TableCell>
                    <TableCell>{semester.description}</TableCell>
                    <TableCell>{semester.from}</TableCell>
                    <TableCell>{semester.to}</TableCell>
                    <TableCell className="text-right">
                      <RowActions
                        onDelete={() => {
                          deleteSemester(semester.id);
                          toast.success(`${semester.name} removed`);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">
              Showing 1 to {semesters.length} of {semesters.length} entries
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function RowActions({ onDelete }: { onDelete: () => void }) {
  return (
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
        onClick={onDelete}
        className="inline-flex size-7 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
