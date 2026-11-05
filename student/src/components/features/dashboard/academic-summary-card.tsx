"use client";

import { BookOpen, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAcademicSummary } from "@/hooks/use-student-portal";

export function AcademicSummaryCard() {
  const { data, isLoading } = useAcademicSummary(true);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="size-4 text-primary" />
          Academics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Cumulative GPA</p>
                <p className="text-2xl font-semibold text-primary">
                  {data?.cgpa != null ? data.cgpa.toFixed(2) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {data?.currentSemesterName ?? "Current semester"} units
                </p>
                <p className="text-2xl font-semibold text-primary">
                  {data?.registeredUnits ?? 0}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <BookOpen className="size-3.5" />
                Registered courses
              </p>
              {!data || data.registeredCourses.length === 0 ? (
                <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  No courses registered yet this semester.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {data.registeredCourses.map((course) => (
                    <li
                      key={course.courseId}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{course.code}</span>
                      <span className="flex-1 truncate px-3 text-muted-foreground">
                        {course.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {course.unit} unit{course.unit === 1 ? "" : "s"}
                      </span>
                      {course.isCarryover && (
                        <Badge variant="destructive" className="ml-2 shrink-0">
                          Carryover
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
