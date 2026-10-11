"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { DAY_LABELS } from "@/lib/lecture-schedule";
import { DAYS_OF_WEEK, type DayOfWeek } from "@/types/lecturer";

export interface TimetableBlock {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  title: string;
  subtitle?: string;
  colorClassName?: string;
  onClick?: () => void;
}

const BLOCK_COLORS = [
  "bg-secondary/15 text-secondary border-secondary/30",
  "bg-primary/10 text-primary border-primary/30",
  "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  "bg-amber-500/10 text-amber-700 border-amber-500/30",
  "bg-violet-500/10 text-violet-700 border-violet-500/30",
  "bg-rose-500/10 text-rose-700 border-rose-500/30",
];

/** Deterministic color per distinct label, so the same course/lecturer always renders the same color across re-renders. */
function colorFor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++)
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return BLOCK_COLORS[hash % BLOCK_COLORS.length];
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

const ROW_MINUTES = 30;
const ROW_HEIGHT_PX = 32;

/**
 * A real weekly calendar grid — days as columns, a shared hour axis down the
 * side, each slot rendered as a positioned block spanning its actual
 * duration — replacing the earlier flat "Monday, 9:00-11:00, Room 4" list
 * rows with something that actually reads like a timetable at a glance.
 */
export function WeeklyTimetableGrid({ blocks }: { blocks: TimetableBlock[] }) {
  const { startHour, endHour } = useMemo(() => {
    if (blocks.length === 0) return { startHour: 8, endHour: 17 };
    const starts = blocks.map((b) => Math.floor(toMinutes(b.startTime) / 60));
    const ends = blocks.map((b) => Math.ceil(toMinutes(b.endTime) / 60));
    return {
      startHour: Math.max(0, Math.min(...starts) - 1),
      endHour: Math.min(24, Math.max(...ends) + 1),
    };
  }, [blocks]);

  const rangeStartMinutes = startHour * 60;
  const totalRows = ((endHour - startHour) * 60) / ROW_MINUTES;
  const hourMarks = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => startHour + i,
  );

  const activeDays = DAYS_OF_WEEK;

  if (blocks.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        No timetable slots scheduled yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <div
        className="grid min-w-[760px]"
        style={{
          gridTemplateColumns: `64px repeat(${activeDays.length}, 1fr)`,
        }}
      >
        {/* Header row */}
        <div className="border-b border-border bg-muted/40" />
        {activeDays.map((day) => (
          <div
            key={day}
            className="border-b border-l border-border bg-muted/40 px-2 py-2 text-center text-xs font-semibold text-foreground"
          >
            {DAY_LABELS[day].slice(0, 3)}
          </div>
        ))}

        {/* Hour axis column */}
        <div
          className="relative border-r border-border"
          style={{ height: totalRows * ROW_HEIGHT_PX }}
        >
          {hourMarks.map((hour) => (
            <div
              key={hour}
              className="absolute right-1.5 -translate-y-1/2 text-[10px] text-muted-foreground"
              style={{
                top:
                  ((hour * 60 - rangeStartMinutes) / ROW_MINUTES) *
                  ROW_HEIGHT_PX,
              }}
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {activeDays.map((day) => (
          <div
            key={day}
            className="relative border-l border-border"
            style={{ height: totalRows * ROW_HEIGHT_PX }}
          >
            {hourMarks.map((hour) => (
              <div
                key={hour}
                className="absolute w-full border-t border-border/60"
                style={{
                  top:
                    ((hour * 60 - rangeStartMinutes) / ROW_MINUTES) *
                    ROW_HEIGHT_PX,
                }}
              />
            ))}
            {blocks
              .filter((b) => b.dayOfWeek === day)
              .map((block) => {
                const top =
                  ((toMinutes(block.startTime) - rangeStartMinutes) /
                    ROW_MINUTES) *
                  ROW_HEIGHT_PX;
                const height =
                  ((toMinutes(block.endTime) - toMinutes(block.startTime)) /
                    ROW_MINUTES) *
                  ROW_HEIGHT_PX;
                const colorClassName =
                  block.colorClassName ?? colorFor(block.title);
                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={block.onClick}
                    disabled={!block.onClick}
                    className={cn(
                      "absolute inset-x-1 overflow-hidden rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm transition-transform",
                      colorClassName,
                      block.onClick && "cursor-pointer hover:scale-[1.02]",
                    )}
                    style={{ top, height: Math.max(height, 22) }}
                  >
                    <p className="truncate font-semibold">{block.title}</p>
                    {block.subtitle && (
                      <p className="truncate opacity-80">{block.subtitle}</p>
                    )}
                    <p className="truncate opacity-70">
                      {block.startTime}–{block.endTime}
                    </p>
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
