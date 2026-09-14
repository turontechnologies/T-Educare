"use client";

import { useMemo, useState } from "react";
import {
  ArchiveRestore,
  CalendarCheck2,
  Eye,
  History,
  MoreHorizontal,
  Pencil,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { RolloverHistoryTab } from "@/components/features/academics/rollover/rollover-history-tab";
import { RolloverWizardDialog } from "@/components/features/academics/rollover/rollover-wizard-dialog";
import { SemesterDialog } from "@/components/features/academics/semester-dialog";
import { SessionDetailsDialog } from "@/components/features/academics/session-details-dialog";
import { SessionDialog } from "@/components/features/academics/session-dialog";
import { cn } from "@/lib/utils";
import { notifyInstitution } from "@/lib/notify";
import { useAcademicsStore } from "@/store/academics.store";
import { useAuthStore } from "@/store/auth.store";
import { useRolloverStore } from "@/store/rollover.store";
import type {
  AcademicPeriodStatus,
  AcademicSemester,
  AcademicSession,
} from "@/types/academics";

const PAGE_SIZE_OPTIONS = ["5", "10", "25", "50"];

const STATUS_BADGE_CLASS: Record<AcademicPeriodStatus, string> = {
  upcoming: "bg-secondary/10 text-secondary",
  active: "bg-emerald-500/10 text-emerald-600",
  completed: "bg-muted text-muted-foreground",
};

const dateOnlyLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
    .format(new Date(iso))
    .replace(/ /g, "-");

export default function SessionManagementPage() {
  const sessions = useAcademicsStore((state) => state.sessions);
  const semesters = useAcademicsStore((state) => state.semesters);

  const [tab, setTab] = useState<"session" | "semester" | "rollover">(
    "session",
  );
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [semesterDialogOpen, setSemesterDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<
    AcademicSession | undefined
  >();
  const [editingSemester, setEditingSemester] = useState<
    AcademicSemester | undefined
  >();
  const [viewingSession, setViewingSession] = useState<
    AcademicSession | undefined
  >();
  const [rolloverSourceId, setRolloverSourceId] = useState<string | null>(null);
  const [semesterFilterSeed, setSemesterFilterSeed] = useState<
    string | undefined
  >();

  const currentSession = sessions.find((s) => s.isCurrent);
  const currentSemester = currentSession
    ? semesters.find((s) => s.isCurrent && s.sessionId === currentSession.id)
    : undefined;

  const manageSemestersFor = (session: AcademicSession) => {
    setSemesterFilterSeed(session.session);
    setTab("semester");
  };

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Semester/Session"]} />

      <div>
        <h1 className="text-xl font-semibold text-primary">
          Semester/Session Management
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm">
            <CalendarCheck2 className="size-4 text-secondary" />
            <span className="text-muted-foreground">Current Session:</span>
            <span className="font-medium text-foreground">
              {currentSession?.session ?? "—"}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm">
            <CalendarCheck2 className="size-4 text-secondary" />
            <span className="text-muted-foreground">Current Semester:</span>
            <span className="font-medium text-foreground">
              {currentSemester?.name ?? "—"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground transition-transform hover:scale-[1.02] hover:bg-tertiary/10 active:scale-[0.98]"
            onClick={() => {
              setEditingSession(undefined);
              setSessionDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add New Session
          </Button>
          <Button
            variant="outline"
            className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground transition-transform hover:scale-[1.02] hover:bg-tertiary/10 active:scale-[0.98]"
            onClick={() => {
              setEditingSemester(undefined);
              setSemesterDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add New Semester
          </Button>
        </div>

        <Tabs
          value={tab}
          onValueChange={(value) =>
            setTab(value as "session" | "semester" | "rollover")
          }
          className="mt-6"
        >
          <TabsList variant="line">
            <TabsTrigger value="session">Session</TabsTrigger>
            <TabsTrigger value="semester">Semester</TabsTrigger>
            <TabsTrigger value="rollover">Rollover History</TabsTrigger>
          </TabsList>

          <TabsContent
            value="session"
            className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
          >
            <SessionTable
              onEdit={(session) => {
                setEditingSession(session);
                setSessionDialogOpen(true);
              }}
              onView={(session) => setViewingSession(session)}
              onManageSemesters={manageSemestersFor}
              onStartRollover={(session) => setRolloverSourceId(session.id)}
              onViewRollover={() => setTab("rollover")}
            />
          </TabsContent>

          <TabsContent
            value="semester"
            className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
          >
            <SemesterTable
              key={semesterFilterSeed ?? "default"}
              initialSearch={semesterFilterSeed}
              onEdit={(semester) => {
                setEditingSemester(semester);
                setSemesterDialogOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent
            value="rollover"
            className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
          >
            <RolloverHistoryTab />
          </TabsContent>
        </Tabs>
      </div>

      <SessionDialog
        open={sessionDialogOpen}
        onOpenChange={setSessionDialogOpen}
        session={editingSession}
      />
      <SemesterDialog
        open={semesterDialogOpen}
        onOpenChange={setSemesterDialogOpen}
        semester={editingSemester}
      />
      <SessionDetailsDialog
        open={!!viewingSession}
        onOpenChange={(open) => !open && setViewingSession(undefined)}
        session={viewingSession}
      />
      {rolloverSourceId && (
        <RolloverWizardDialog
          open={!!rolloverSourceId}
          onOpenChange={(open) => !open && setRolloverSourceId(null)}
          sourceSessionId={rolloverSourceId}
        />
      )}
    </div>
  );
}

function SessionTable({
  onEdit,
  onView,
  onManageSemesters,
  onStartRollover,
  onViewRollover,
}: {
  onEdit: (session: AcademicSession) => void;
  onView: (session: AcademicSession) => void;
  onManageSemesters: (session: AcademicSession) => void;
  onStartRollover: (session: AcademicSession) => void;
  onViewRollover: (session: AcademicSession) => void;
}) {
  const authUser = useAuthStore((state) => state.user);
  const sessions = useAcademicsStore((state) => state.sessions);
  const archiveSession = useAcademicsStore((state) => state.archiveSession);
  const restoreSession = useAcademicsStore((state) => state.restoreSession);
  const setCurrentSession = useAcademicsStore(
    (state) => state.setCurrentSession,
  );
  const closeSession = useAcademicsStore((state) => state.closeSession);
  const rolloverRecords = useRolloverStore((state) => state.records);

  const [view, setView] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("5");
  const [page, setPage] = useState(1);
  const [pendingArchive, setPendingArchive] = useState<AcademicSession | null>(
    null,
  );
  const [pendingClose, setPendingClose] = useState<AcademicSession | null>(
    null,
  );

  const hasCompletedRollover = (sessionId: string) =>
    rolloverRecords.some(
      (r) => r.status === "completed" && r.fromSessionId === sessionId,
    );

  const baseList = useMemo(
    () =>
      sessions.filter((session) =>
        view === "archived" ? session.archivedAt : !session.archivedAt,
      ),
    [sessions, view],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return baseList;
    return baseList.filter((session) =>
      session.session.toLowerCase().includes(query),
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
  const archivedCount = sessions.filter((s) => s.archivedAt).length;

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setView((v) => (v === "active" ? "archived" : "active"));
            setPage(1);
            setSearch("");
          }}
          className="cursor-pointer text-sm font-medium text-secondary hover:underline"
        >
          {view === "active"
            ? `View archived (${archivedCount})`
            : "← Back to active sessions"}
        </button>
      </div>

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
            <Label htmlFor="session-search" className="text-muted-foreground">
              Search:
            </Label>
            <Input
              id="session-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="h-8 w-48"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S/N</TableHead>
                <TableHead>Session Name</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((session, index) => (
                <TableRow
                  key={session.id}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="text-muted-foreground">
                    {rangeStart + index}
                  </TableCell>
                  <TableCell className="font-medium">
                    {session.session}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateOnlyLabel(session.from)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateOnlyLabel(session.to)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        className={cn(
                          "capitalize",
                          STATUS_BADGE_CLASS[session.status],
                        )}
                      >
                        {session.status}
                      </Badge>
                      {session.isCurrent && (
                        <Badge className="bg-tertiary/15 text-tertiary-foreground">
                          Current
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {view === "active" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Actions for ${session.session}`}
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => onView(session)}>
                            <Eye className="size-3.5" />
                            View
                          </DropdownMenuItem>

                          {session.status === "upcoming" && (
                            <>
                              <DropdownMenuItem onClick={() => onEdit(session)}>
                                <Pencil className="size-3.5" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setCurrentSession(session.id);
                                  toast.success(
                                    `${session.session} set as the current session`,
                                  );
                                  if (authUser?.institutionId) {
                                    notifyInstitution(
                                      authUser.institutionId,
                                      "Current session changed",
                                      `${session.session} is now the current academic session.`,
                                      "/dashboard/academics/sessions",
                                    );
                                  }
                                }}
                              >
                                <CalendarCheck2 className="size-3.5" />
                                Set as Current
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onManageSemesters(session)}
                              >
                                <History className="size-3.5" />
                                Manage Semesters
                              </DropdownMenuItem>
                            </>
                          )}

                          {session.status === "active" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => onManageSemesters(session)}
                              >
                                <History className="size-3.5" />
                                Manage Semesters
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setPendingClose(session)}
                              >
                                <CalendarCheck2 className="size-3.5" />
                                Close Session
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onStartRollover(session)}
                              >
                                <Repeat className="size-3.5" />
                                Start Rollover
                              </DropdownMenuItem>
                            </>
                          )}

                          {session.status === "completed" && (
                            <>
                              {hasCompletedRollover(session.id) ? (
                                <DropdownMenuItem
                                  onClick={() => onViewRollover(session)}
                                >
                                  <History className="size-3.5" />
                                  View Rollover
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => onStartRollover(session)}
                                >
                                  <Repeat className="size-3.5" />
                                  Start Rollover
                                </DropdownMenuItem>
                              )}
                            </>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPendingArchive(session)}
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          restoreSession(session.id);
                          toast.success(`${session.session} restored`);
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
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {view === "archived"
                      ? "No archived sessions."
                      : "No sessions match your search."}
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
        title="Delete this session?"
        description={`Are you sure you want to delete ${pendingArchive?.session}? It will be hidden from the active list, but nothing is deleted — you can restore it anytime from "View archived".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!pendingArchive) return;
          archiveSession(pendingArchive.id);
          toast.success(`${pendingArchive.session} deleted`);
        }}
      />

      <ConfirmDialog
        open={!!pendingClose}
        onOpenChange={(open) => !open && setPendingClose(null)}
        title="Close this session?"
        description={`Are you sure you want to close ${pendingClose?.session}? It will be marked completed and made eligible for rollover into the next session.`}
        confirmLabel="Close Session"
        onConfirm={() => {
          if (!pendingClose) return;
          closeSession(pendingClose.id);
          toast.success(`${pendingClose.session} closed`);
          if (authUser?.institutionId) {
            notifyInstitution(
              authUser.institutionId,
              "Session closed",
              `${pendingClose.session} has been closed and is ready for rollover.`,
              "/dashboard/academics/sessions",
            );
          }
        }}
      />
    </>
  );
}

function SemesterTable({
  onEdit,
  initialSearch,
}: {
  onEdit: (semester: AcademicSemester) => void;
  initialSearch?: string;
}) {
  const authUser = useAuthStore((state) => state.user);
  const semesters = useAcademicsStore((state) => state.semesters);
  const sessions = useAcademicsStore((state) => state.sessions);
  const archiveSemester = useAcademicsStore((state) => state.archiveSemester);
  const restoreSemester = useAcademicsStore((state) => state.restoreSemester);
  const setCurrentSemester = useAcademicsStore(
    (state) => state.setCurrentSemester,
  );
  const closeSemester = useAcademicsStore((state) => state.closeSemester);

  const [view, setView] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState(initialSearch ?? "");
  const [pageSize, setPageSize] = useState("5");
  const [page, setPage] = useState(1);
  const [pendingArchive, setPendingArchive] = useState<AcademicSemester | null>(
    null,
  );
  const [pendingClose, setPendingClose] = useState<AcademicSemester | null>(
    null,
  );

  const sessionName = (sessionId: string) =>
    sessions.find((s) => s.id === sessionId)?.session ?? "—";

  const baseList = useMemo(
    () =>
      semesters.filter((semester) =>
        view === "archived" ? semester.archivedAt : !semester.archivedAt,
      ),
    [semesters, view],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return baseList;
    return baseList.filter(
      (semester) =>
        semester.name.toLowerCase().includes(query) ||
        sessionName(semester.sessionId).toLowerCase().includes(query),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseList, search, sessions]);

  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * size,
    currentPage * size,
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * size + 1;
  const rangeEnd = Math.min(currentPage * size, filtered.length);
  const archivedCount = semesters.filter((s) => s.archivedAt).length;

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setView((v) => (v === "active" ? "archived" : "active"));
            setPage(1);
            setSearch("");
          }}
          className="cursor-pointer text-sm font-medium text-secondary hover:underline"
        >
          {view === "active"
            ? `View archived (${archivedCount})`
            : "← Back to active semesters"}
        </button>
      </div>

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
            <Label htmlFor="semester-search" className="text-muted-foreground">
              Search:
            </Label>
            <Input
              id="semester-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="h-8 w-48"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S/N</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Semester Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((semester, index) => (
                <TableRow
                  key={semester.id}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="text-muted-foreground">
                    {rangeStart + index}
                  </TableCell>
                  <TableCell>{sessionName(semester.sessionId)}</TableCell>
                  <TableCell className="font-medium">{semester.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {semester.description}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateOnlyLabel(semester.from)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateOnlyLabel(semester.to)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        className={cn(
                          "capitalize",
                          STATUS_BADGE_CLASS[semester.status],
                        )}
                      >
                        {semester.status}
                      </Badge>
                      {semester.isCurrent && (
                        <Badge className="bg-tertiary/15 text-tertiary-foreground">
                          Current
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {view === "active" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Actions for ${semester.name}`}
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => onEdit(semester)}>
                            <Pencil className="size-3.5" />
                            Edit
                          </DropdownMenuItem>
                          {semester.status === "upcoming" && (
                            <DropdownMenuItem
                              onClick={() => {
                                setCurrentSemester(semester.id);
                                toast.success(
                                  `${semester.name} set as the current semester`,
                                );
                                if (authUser?.institutionId) {
                                  notifyInstitution(
                                    authUser.institutionId,
                                    "Current semester changed",
                                    `${semester.name} is now the current semester.`,
                                    "/dashboard/academics/sessions",
                                  );
                                }
                              }}
                            >
                              <CalendarCheck2 className="size-3.5" />
                              Set as Current
                            </DropdownMenuItem>
                          )}
                          {semester.status === "active" && (
                            <DropdownMenuItem
                              onClick={() => setPendingClose(semester)}
                            >
                              <CalendarCheck2 className="size-3.5" />
                              Close Semester
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPendingArchive(semester)}
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          restoreSemester(semester.id);
                          toast.success(`${semester.name} restored`);
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
                    colSpan={8}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {view === "archived"
                      ? "No archived semesters."
                      : "No semesters match your search."}
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
        title="Delete this semester?"
        description={`Are you sure you want to delete ${pendingArchive?.name}? It will be hidden from the active list, but nothing is deleted — you can restore it anytime from "View archived".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!pendingArchive) return;
          archiveSemester(pendingArchive.id);
          toast.success(`${pendingArchive.name} deleted`);
        }}
      />

      <ConfirmDialog
        open={!!pendingClose}
        onOpenChange={(open) => !open && setPendingClose(null)}
        title="Close this semester?"
        description={`Are you sure you want to close ${pendingClose?.name}? It will be marked completed.`}
        confirmLabel="Close Semester"
        onConfirm={() => {
          if (!pendingClose) return;
          closeSemester(pendingClose.id);
          toast.success(`${pendingClose.name} closed`);
        }}
      />
    </>
  );
}
