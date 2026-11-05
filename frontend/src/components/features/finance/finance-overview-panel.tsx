"use client";

import { BadgePercent, CreditCard, TrendingUp, Wallet } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinanceOverview } from "@/hooks/use-finance";

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

export function FinanceOverviewPanel() {
  const { data: overview } = useFinanceOverview();

  if (!overview) {
    return null;
  }

  const maxAge = Math.max(1, ...overview.outstandingByAge.map((b) => b.amount));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total revenue"
          value={formatNaira(overview.totalRevenue)}
          icon={Wallet}
        />
        <SummaryCard
          label="Total outstanding"
          value={formatNaira(overview.totalOutstanding)}
          icon={CreditCard}
        />
        <SummaryCard
          label="Payroll due this month"
          value={formatNaira(overview.payrollDueThisMonth)}
          icon={TrendingUp}
        />
        <SummaryCard
          label="Fee collection rate"
          value={`${overview.feeCollectionRate.toFixed(0)}%`}
          icon={BadgePercent}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-primary">Revenue trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {overview.revenueTrend.every((p) => p.amount === 0) ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <TrendingUp className="size-8" />
                <p className="text-sm">No payments recorded yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={overview.revenueTrend}
                  margin={{ left: 0, right: 8, top: 8 }}
                >
                  <defs>
                    <linearGradient
                      id="revenueFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
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
                    dataKey="weekLabel"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={50}
                    tickFormatter={(value: number) =>
                      `₦${(value / 1000).toFixed(0)}k`
                    }
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    formatter={(value) => formatNaira(Number(value))}
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
                    dataKey="amount"
                    stroke="var(--secondary)"
                    strokeWidth={2}
                    fill="url(#revenueFill)"
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
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Outstanding by age</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.outstandingByAge.map((bucket) => (
              <div key={bucket.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{bucket.label}</span>
                  <span className="font-medium text-foreground">
                    {formatNaira(bucket.amount)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-secondary transition-all"
                    style={{ width: `${(bucket.amount / maxAge) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {bucket.studentCount} line
                  {bucket.studentCount === 1 ? "" : "s"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">
            Top outstanding debtors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {overview.topDebtors.map((debtor) => (
            <div
              key={debtor.studentId}
              className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="font-medium text-foreground">
                  {debtor.studentName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {debtor.matricNo} · {debtor.departmentName}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-destructive/10 text-destructive">
                  {formatNaira(debtor.balance)}
                </Badge>
              </div>
            </div>
          ))}
          {overview.topDebtors.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No outstanding balances.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
