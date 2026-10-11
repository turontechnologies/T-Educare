"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArchiveRestore,
  CalendarClock,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { ChangeRequestsPanel } from "@/components/features/lectures/change-requests-panel";
import { LectureAssignmentDetailsDialog } from "@/components/features/lectures/lecture-assignment-details-dialog";
import { LectureAssignmentDialog } from "@/components/features/lectures/lecture-assignment-dialog";
import { LecturerDetailsDialog } from "@/components/features/lectures/lecturer-details-dialog";
import { LecturerDialog } from "@/components/features/lectures/lecturer-dialog";
import { MyLecturesView } from "@/components/features/lectures/my-lectures-view";
import { TimetableSlotsDialog } from "@/components/features/lectures/timetable-slots-dialog";
import {
  WeeklyTimetableGrid,
  type TimetableBlock,
} from "@/components/features/lectures/weekly-timetable-grid";
import {
  useArchiveLectureAssignment,
  useLectureAssignments,
  useRestoreLectureAssignment,
} from "@/hooks/use-lecture-assignments";
import {
  useArchiveLecturer,
  useExportLecturers,
  useImportLecturers,
  useRestoreLecturer,
} from "@/hooks/use-lecturers";
import { fullName } from "@/lib/lecturers";
import { useAuthStore } from "@/store/auth.store";
import { useCoursesStore } from "@/store/courses.store";
import { useFacultiesStore } from "@/store/faculties.store";
import { useLecturersStore } from "@/store/lecturers.store";
import { useSchoolsStore } from "@/store/schools.store";
import type { Lecturer, LectureAssignment } from "@/types/lecturer";

const PAGE_SIZE_OPTIONS = ["10", "25", "50"];

export default function LectureManagementPage() {
  const lecturerId = useAuthStore((state) => state.user?.lecturerId);

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Lecture Management"]} />

      <div>
        <h1 className="text-xl font-semibold text-primary">
          Lecture Management
        </h1>

        {lecturerId ? (
          <div className="mt-6">
            <MyLecturesView lecturerId={lecturerId} />
          </div>
        ) : (
          <AdminLectureManagement />
        )}
      </div>
    </div>
  );
}

function AdminLectureManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<
    Lecturer | undefined
  >();
  const [viewingLecturer, setViewingLecturer] = useState<
    Lecturer | undefined
  >();

  return (
    <Tabs defaultValue="lecturers" className="mt-6">
      <TabsList variant="line">
        <TabsTrigger value="lecturers">Lecturers</TabsTrigger>
        <TabsTrigger value="lectures">Lectures &amp; Timetable</TabsTrigger>
      </TabsList>

      <TabsContent
        value="lecturers"
        className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
      >
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground transition-transform hover:scale-[1.02] hover:bg-tertiary/10 active:scale-[0.98]"
            onClick={() => {
              setEditingLecturer(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add New
          </Button>
          <ImportExportButtons />
        </div>

        <div className="mt-6">
          <LecturerTable
            onEdit={(lecturer) => {
              setEditingLecturer(lecturer);
              setDialogOpen(true);
            }}
            onView={(lecturer) => setViewingLecturer(lecturer)}
          />
        </div>

        <LecturerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          lecturer={editingLecturer}
        />
        <LecturerDetailsDialog
          open={!!viewingLecturer}
          onOpenChange={(open) => !open && setViewingLecturer(undefined)}
          lecturer={viewingLecturer}
        />
      </TabsContent>

      <TabsContent
        value="lectures"
        className="animate-in fade-in slide-in-from-bottom-1 mt-4 space-y-6 duration-300"
      >
        <LecturesTab />
        <ChangeRequestsPanel />
      </TabsContent>
    </Tabs>
  );
}

function ImportExportButtons() {
  const importLecturers = useImportLecturers();
  const exportLecturers = useExportLecturers();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const blob = await exportLecturers.mutateAsync(false);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lecturers-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Lecturers exported");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to export lecturers",
      );
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const result = await importLecturers.mutateAsync(file);
      toast.success(
        `${result.imported} lecturers imported${result.skipped > 0 ? `, ${result.skipped} skipped` : ""}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to import lecturers",
      );
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="gap-1.5 rounded-md"
        disabled={importLecturers.isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        <Download className="size-4" />
        Import Lecturers
      </Button>
      <Button
        variant="outline"
        className="gap-1.5 rounded-md"
        disabled={exportLecturers.isPending}
        onClick={handleExport}
      >
        <Upload className="size-4" />
        Export Lecturers
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleImportFile(file);
          event.target.value = "";
        }}
        className="sr-only"
      />
    </>
  );
}

function LecturerTable({
  onEdit,
  onView,
}: {
  onEdit: (lecturer: Lecturer) => void;
  onView: (lecturer: Lecturer) => void;
}) {
  const lecturers = useLecturersStore((state) => state.lecturers);
  const archiveLecturer = useArchiveLecturer();
  const restoreLecturer = useRestoreLecturer();
  const schools = useSchoolsStore((state) => state.schools);
  const faculties = useFacultiesStore((state) => state.faculties);

  const [view, setView] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);
  const [pendingArchive, setPendingArchive] = useState<Lecturer | null>(null);
  const [pendingBulkArchive, setPendingBulkArchive] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const assignmentName = (lecturer: Lecturer) =>
    lecturer.assignmentType === "school"
      ? (schools.find((s) => s.id === lecturer.assignmentId)?.name ?? "—")
      : (faculties.find((f) => f.id === lecturer.assignmentId)?.name ?? "—");

  const baseList = useMemo(
    () =>
      lecturers.filter((lecturer) =>
        view === "archived" ? lecturer.archivedAt : !lecturer.archivedAt,
      ),
    [lecturers, view],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return baseList;
    return baseList.filter(
      (lecturer) =>
        fullName(lecturer).toLowerCase().includes(query) ||
        lecturer.username.toLowerCase().includes(query) ||
        lecturer.position.toLowerCase().includes(query),
    );
  }, [baseList, search]);

  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * size,
    currentPage * size,
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * size + 1;
  const rangeEnd = Math.min(currentPage * size, filtered.length);
  const archivedCount = lecturers.filter((l) => l.archivedAt).length;

  const allOnPageSelected =
    paginated.length > 0 && paginated.every((l) => selected.has(l.id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        paginated.forEach((l) => next.delete(l.id));
      } else {
        paginated.forEach((l) => next.add(l.id));
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setView((v) => (v === "active" ? "archived" : "active"));
            setPage(1);
            setSearch("");
            setSelected(new Set());
          }}
          className="cursor-pointer text-sm font-medium text-secondary hover:underline"
        >
          {view === "active"
            ? `View archived (${archivedCount})`
            : "← Back to active lecturers"}
        </button>
      </div>

      {view === "active" && selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-secondary/30 bg-secondary/5 px-4 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-sm font-medium text-foreground">
            {selected.size} selected
          </span>
          <button
            type="button"
            onClick={() => setPendingBulkArchive(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            Delete Selected
          </button>
        </div>
      )}

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Show</span>
            <Select
              value={pageSize}
              onValueChange={(value) => {
                if (value) {
                  setPageSize(value);
                  setPage(1);
                }
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Label htmlFor="lecturer-search" className="text-muted-foreground">
              Filter:
            </Label>
            <Input
              id="lecturer-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Name, username, or position"
              className="h-8 w-56"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {view === "active" && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allOnPageSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all lecturers on this page"
                    />
                  </TableHead>
                )}
                <TableHead>S/N</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Middle Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>School/Faculty</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((lecturer, index) => (
                <TableRow
                  key={lecturer.id}
                  className="animate-in fade-in duration-300"
                >
                  {view === "active" && (
                    <TableCell>
                      <Checkbox
                        checked={selected.has(lecturer.id)}
                        onCheckedChange={() => toggleSelect(lecturer.id)}
                        aria-label={`Select ${fullName(lecturer)}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground">
                    {rangeStart + index}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => onView(lecturer)}
                      className="cursor-pointer font-mono text-xs font-medium text-secondary hover:underline"
                    >
                      {lecturer.username}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">
                    {lecturer.firstName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lecturer.middleName ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {lecturer.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lecturer.gender}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lecturer.position}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {assignmentName(lecturer)}
                  </TableCell>
                  <TableCell className="text-right">
                    {view === "active" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Actions for ${fullName(lecturer)}`}
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => onEdit(lecturer)}>
                            <Pencil className="size-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPendingArchive(lecturer)}
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await restoreLecturer.mutateAsync(lecturer.id);
                            toast.success(`${fullName(lecturer)} restored`);
                          } catch (error) {
                            toast.error(
                              error instanceof Error
                                ? error.message
                                : "Failed to restore lecturer",
                            );
                          }
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-secondary transition-colors hover:bg-secondary/10"
                      >
                        <ArchiveRestore className="size-3.5" />
                        Restore
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={view === "active" ? 10 : 9}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {view === "archived"
                      ? "No archived lecturers."
                      : "No lecturers match your search."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>
              Showing {rangeStart} to {rangeEnd} of {filtered.length} entries
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  variant={n === currentPage ? "default" : "outline"}
                  size="sm"
                  className="size-7 p-0"
                  onClick={() => setPage(n)}
                >
                  {n}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!pendingArchive}
        onOpenChange={(open) => !open && setPendingArchive(null)}
        title="Delete this lecturer?"
        description={`Are you sure you want to delete ${pendingArchive ? fullName(pendingArchive) : ""}? It will be hidden from the active list, but nothing is deleted — you can restore it anytime from "View archived".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!pendingArchive) return;
          try {
            await archiveLecturer.mutateAsync(pendingArchive.id);
            toast.success(`${fullName(pendingArchive)} deleted`);
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to delete lecturer",
            );
          }
        }}
      />

      <ConfirmDialog
        open={pendingBulkArchive}
        onOpenChange={setPendingBulkArchive}
        title={`Delete ${selected.size} lecturers?`}
        description={`Are you sure you want to delete the ${selected.size} selected lecturers? They will be hidden from the active list, but nothing is deleted — you can restore them anytime from "View archived".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          const ids = Array.from(selected);
          try {
            await Promise.all(ids.map((id) => archiveLecturer.mutateAsync(id)));
            toast.success(`${ids.length} lecturers deleted`);
            setSelected(new Set());
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to delete selected lecturers",
            );
          }
        }}
      />
    </>
  );
}

function LecturesTab() {
  const { data: assignments } = useLectureAssignments({});
  const lecturers = useLecturersStore((state) => state.lecturers);
  const courses = useCoursesStore((state) => state.courses);
  const archiveAssignment = useArchiveLectureAssignment();
  const restoreAssignment = useRestoreLectureAssignment();

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [timetableFor, setTimetableFor] = useState<
    LectureAssignment | undefined
  >();
  const [viewingAssignment, setViewingAssignment] = useState<
    LectureAssignment | undefined
  >();
  const [view, setView] = useState<"active" | "archived">("active");

  const lecturerName = (id: string) =>
    fullName(
      lecturers.find((l) => l.id === id) ?? { firstName: "—", lastName: "" },
    );
  const courseLabel = (id: string) => {
    const course = courses.find((c) => c.id === id);
    return course ? `${course.code} — ${course.name}` : "—";
  };
  const courseUnit = (id: string) => courses.find((c) => c.id === id)?.unit;

  const filtered = (assignments ?? []).filter((a) =>
    view === "archived" ? a.archivedAt : !a.archivedAt,
  );

  const blocks: TimetableBlock[] = (assignments ?? [])
    .filter((a) => !a.archivedAt)
    .flatMap((assignment) => {
      const unit = courseUnit(assignment.courseId);
      return assignment.timetableSlots.map((slot) => ({
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        title: courseLabel(assignment.courseId),
        subtitle: `${lecturerName(assignment.lecturerId)}${unit !== undefined ? ` · ${unit} unit${unit === 1 ? "" : "s"}` : ""}`,
        onClick: () => setViewingAssignment(assignment),
      }));
    });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-medium text-foreground">
          Institution Timetable
        </h3>
        <WeeklyTimetableGrid blocks={blocks} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            setView((v) => (v === "active" ? "archived" : "active"))
          }
          className="cursor-pointer text-sm font-medium text-secondary hover:underline"
        >
          {view === "active" ? "View archived" : "← Back to active"}
        </button>
        <Button
          variant="outline"
          className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground"
          onClick={() => setAssignDialogOpen(true)}
        >
          <Plus className="size-4" />
          Assign Lecturer to Course
        </Button>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardContent className="space-y-2 pt-5">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No lecture assignments yet.
            </p>
          ) : (
            filtered.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {lecturerName(assignment.lecturerId)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {courseLabel(assignment.courseId)} ·{" "}
                    {assignment.timetableSlots.length} timetable slot
                    {assignment.timetableSlots.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {view === "active" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setViewingAssignment(assignment)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-secondary transition-colors hover:bg-secondary/10"
                      >
                        <Eye className="size-3.5" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimetableFor(assignment)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-secondary transition-colors hover:bg-secondary/10"
                      >
                        <CalendarClock className="size-3.5" />
                        Manage Timetable
                      </button>
                      <button
                        type="button"
                        aria-label="Delete assignment"
                        onClick={async () => {
                          try {
                            await archiveAssignment.mutateAsync(assignment.id);
                            toast.success("Assignment removed");
                          } catch (error) {
                            toast.error(
                              error instanceof Error
                                ? error.message
                                : "Failed to remove assignment",
                            );
                          }
                        }}
                        className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await restoreAssignment.mutateAsync(assignment.id);
                          toast.success("Assignment restored");
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "Failed to restore assignment",
                          );
                        }
                      }}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-secondary transition-colors hover:bg-secondary/10"
                    >
                      <ArchiveRestore className="size-3.5" />
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <LectureAssignmentDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
      />
      <TimetableSlotsDialog
        open={!!timetableFor}
        onOpenChange={(open) => !open && setTimetableFor(undefined)}
        assignment={timetableFor}
      />
      <LectureAssignmentDetailsDialog
        open={!!viewingAssignment}
        onOpenChange={(open) => !open && setViewingAssignment(undefined)}
        assignment={viewingAssignment}
      />
    </div>
  );
}
