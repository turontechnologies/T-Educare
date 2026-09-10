"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
import { cn } from "@/lib/utils";

const RANGE_OPTIONS = ["Day", "Week", "Month"] as const;
type Range = (typeof RANGE_OPTIONS)[number];

type Point = { label: string; value: number };

const DATA: Record<Range, Point[]> = {
  Month: [
    { label: "Feb", value: 180 },
    { label: "Mar", value: 420 },
    { label: "Apr", value: 260 },
    { label: "May", value: 400 },
    { label: "Jun", value: 220 },
    { label: "Jul", value: 340 },
    { label: "Aug", value: 200 },
    { label: "Sep", value: 260 },
    { label: "Oct", value: 360 },
  ],
  Week: [
    { label: "Mon", value: 60 },
    { label: "Tue", value: 90 },
    { label: "Wed", value: 70 },
    { label: "Thu", value: 110 },
    { label: "Fri", value: 95 },
    { label: "Sat", value: 50 },
    { label: "Sun", value: 40 },
  ],
  Day: [
    { label: "6am", value: 8 },
    { label: "9am", value: 22 },
    { label: "12pm", value: 18 },
    { label: "3pm", value: 26 },
    { label: "6pm", value: 14 },
    { label: "9pm", value: 6 },
  ],
};

export function EnrollmentChart() {
  const [range, setRange] = useState<Range>("Day");
  const data = DATA[range];

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-primary">
          Registered students per program
        </CardTitle>
        <CardAction>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  range === option
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="enrollmentFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--secondary)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--secondary)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={40}
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
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--secondary)"
              strokeWidth={2}
              fill="url(#enrollmentFill)"
              dot={{
                r: 4,
                strokeWidth: 2,
                stroke: "var(--secondary)",
                fill: "var(--popover)",
              }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
