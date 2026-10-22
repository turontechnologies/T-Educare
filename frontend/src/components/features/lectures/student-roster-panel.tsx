"use client";

import { GraduationCap, User, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useMyStudentRoster } from "@/hooks/use-lecture-assignments";

/**
 * A lecturer's own courses for the current semester, each with the students
 * registered for it — deliberately minimal (matric number + photo only,
 * never a name or other detail), by explicit request. Distinct from the
 * admin-side Students module, which shows the full record.
 */
export function StudentRosterPanel() {
  const { data: roster = [], isLoading } = useMyStudentRoster();

  const totalStudents = roster.reduce((sum, c) => sum + c.students.length, 0);

  if (!isLoading && roster.length === 0) {
    return (
      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
          <Users className="size-8" />
          <p className="text-sm">
            No students to show yet — either no semester is marked current, or
            you have no course assigned for it.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
      <CardHeader>
        <p className="text-sm font-medium text-foreground">Your Students</p>
        <p className="text-xs text-muted-foreground">
          {totalStudents} student{totalStudents === 1 ? "" : "s"} across{" "}
          {roster.length} course{roster.length === 1 ? "" : "s"} this semester.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {roster.map((course) => (
          <div key={course.courseId}>
            <div className="mb-3 flex items-center gap-2">
              <GraduationCap className="size-4 text-secondary" />
              <p className="text-sm font-medium text-foreground">
                {course.courseCode} — {course.courseName}
              </p>
              <span className="text-xs text-muted-foreground">
                ({course.students.length})
              </span>
            </div>

            {course.students.length === 0 ? (
              <p className="pl-6 text-xs text-muted-foreground">
                No students registered for this course yet.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {course.students.map((student) => (
                  <div
                    key={student.studentId}
                    className="flex flex-col items-center gap-1.5 rounded-md border border-border p-2.5 text-center"
                  >
                    <Avatar className="size-14">
                      <AvatarImage
                        src={student.avatarUrl ?? undefined}
                        alt={student.matricNo ?? "Student"}
                      />
                      <AvatarFallback>
                        <User className="size-6" />
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-mono text-xs font-medium text-foreground">
                      {student.matricNo ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
