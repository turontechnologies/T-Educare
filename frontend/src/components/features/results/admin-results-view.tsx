"use client";

import { useState } from "react";
import { Calendar, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkingGuideDialog } from "./marking-guide-dialog";
import { GracePeriodDialog } from "./grace-period-dialog";
import { ProgramsPanel } from "./programs-panel";
import { CoursesPanel } from "./courses-panel";
import { useAcademicsStore } from "@/store/academics.store";

export function AdminResultsView() {
  const [markingGuideOpen, setMarkingGuideOpen] = useState(false);
  const [gracePeriodOpen, setGracePeriodOpen] = useState(false);

  const semesters = useAcademicsStore((state) => state.semesters);
  const currentSemester = semesters.find((s) => s.isCurrent && !s.archivedAt);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 rounded-md py-1.5 text-xs"
          >
            <Calendar className="size-3.5" />
            Current Session: {currentSemester?.name.split(" ")[0] ?? "—"}
          </Badge>
          <Badge
            variant="outline"
            className="gap-1.5 rounded-md py-1.5 text-xs"
          >
            <Calendar className="size-3.5" />
            Current Semester: {currentSemester?.name ?? "—"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground"
            onClick={() => setMarkingGuideOpen(true)}
          >
            <Settings className="size-4" />
            Marking Guide Settings
          </Button>
          <Button
            variant="outline"
            className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground"
            onClick={() => setGracePeriodOpen(true)}
          >
            <Settings className="size-4" />
            Grace Period Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="programs">
        <TabsList variant="line">
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
        </TabsList>

        <TabsContent
          value="programs"
          className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
        >
          <ProgramsPanel academicSemesterId={currentSemester?.id} />
        </TabsContent>

        <TabsContent
          value="courses"
          className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
        >
          <CoursesPanel academicSemesterId={currentSemester?.id} />
        </TabsContent>
      </Tabs>

      <MarkingGuideDialog
        open={markingGuideOpen}
        onOpenChange={setMarkingGuideOpen}
      />
      <GracePeriodDialog
        open={gracePeriodOpen}
        onOpenChange={setGracePeriodOpen}
      />
    </div>
  );
}
