import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import type { SemesterResultSummary } from "@/types/student-portal";

export function ResultsPerSemesterCard({
  result,
}: {
  result: SemesterResultSummary;
}) {
  const gpaPercent =
    result.gpa != null ? Math.min(100, (result.gpa / 5) * 100) : 0;

  return (
    <Card>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {result.sessionLabel} · {result.semesterName}
        </p>

        <div>
          <p className="text-3xl font-semibold text-foreground">
            {result.gpa != null ? result.gpa.toFixed(2) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {result.isProvisional ? "Provisional GPA" : "GPA"}
          </p>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${gpaPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {result.courseCount} course{result.courseCount === 1 ? "" : "s"} ·{" "}
            {result.totalUnits} units
          </span>
          {result.cumulativeCgpa != null && (
            <span>CGPA {result.cumulativeCgpa.toFixed(2)}</span>
          )}
        </div>

        {result.isProvisional && result.resultsStillToCome ? (
          <p className="text-xs text-muted-foreground">
            {result.resultsStillToCome} result
            {result.resultsStillToCome === 1 ? "" : "s"} still to come
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => toast.info("Full result breakdown is coming soon.")}
          className="inline-flex cursor-pointer items-center gap-0.5 text-xs font-medium text-secondary hover:underline"
        >
          View result
          <ChevronRight className="size-3.5" />
        </button>
      </CardContent>
    </Card>
  );
}
