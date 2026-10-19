"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAttendanceTrend } from "@/hooks/use-attendance";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS = [
  { label: "14 Days", value: 14 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
];

const SERIES = [
  { key: "presentCount", label: "Present", color: "var(--color-emerald-500)" },
  { key: "lateCount", label: "Late", color: "var(--color-amber-500)" },
  { key: "onLeaveCount", label: "On Leave", color: "var(--tertiary)" },
  { key: "absentCount", label: "Absent", color: "var(--destructive)" },
  {
    key: "notClockedInCount",
    label: "Not Clocked In",
    color: "var(--muted-foreground)",
  },
] as const;

interface AttendanceTrendChartProps {
  /** Scopes the trend to one department — the same filter the Overview table above is scoped by, so the two always agree on who's being counted. */
  departmentId?: string;
  /** Clicking a day's bar jumps the Overview table above to that date — the quickest way from "this day looks bad" to "here's exactly who was out." */
  onBarClick?: (date: string) => void;
}

/**
 * Daily attendance composition over time — a stacked bar per day so an
 * admin can read both the headcount and its breakdown at a glance (e.g.
 * "lateness spikes every Monday"), not just today's single-day snapshot
 * the stat cards above already show.
 */
export function AttendanceTrendChart({
  departmentId,
  onBarClick,
}: AttendanceTrendChartProps) {
  const [days, setDays] = useState(14);
  const { data = [] } = useAttendanceTrend(days, departmentId);

  const chartData = useMemo(
    () =>
      data.map((point) => ({
        ...point,
        label: format(new Date(`${point.date}T00:00:00`), "d MMM"),
      })),
    [data],
  );

  const hasAnyData = chartData.some(
    (point) =>
      point.presentCount +
        point.lateCount +
        point.onLeaveCount +
        point.absentCount +
        point.notClockedInCount >
      0,
  );

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-primary">Attendance Trend</CardTitle>
        <CardAction>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDays(option.value)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  days === option.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="h-80">
        {!hasAnyData ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <BarChart3 className="size-8" />
            <p className="text-sm">No attendance activity in this range yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                interval={days > 30 ? Math.floor(days / 15) : 0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={32}
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="circle"
                iconSize={8}
              />
              {SERIES.map((series) => (
                <Bar
                  key={series.key}
                  dataKey={series.key}
                  name={series.label}
                  stackId="attendance"
                  fill={series.color}
                  radius={
                    series.key === SERIES[SERIES.length - 1].key
                      ? [0, 0, 2, 2]
                      : series.key === "presentCount"
                        ? [2, 2, 0, 0]
                        : undefined
                  }
                  className={onBarClick ? "cursor-pointer" : undefined}
                  onClick={
                    onBarClick
                      ? (barData: { payload?: { date?: string } }) => {
                          const clickedDate = barData?.payload?.date;
                          if (clickedDate) onBarClick(clickedDate);
                        }
                      : undefined
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
