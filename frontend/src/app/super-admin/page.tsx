"use client";

import Link from "next/link";
import { Banknote, GraduationCap, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useInstitutionsStore } from "@/store/institutions.store";
import { cn } from "@/lib/utils";

const dateLabel = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format;

export default function SuperAdminDashboardPage() {
  const institutions = useInstitutionsStore((state) => state.institutions);
  const totalStudents = institutions.reduce(
    (sum, i) => sum + i.studentCount,
    0,
  );
  const totalRevenue = institutions.reduce((sum, i) => sum + i.revenue, 0);
  const recent = [...institutions]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Dashboard"]} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Number of Institutions"
          value={String(institutions.length)}
          icon={Landmark}
          iconClassName="bg-secondary/10 text-secondary"
        />
        <StatCard
          label="Total number of student population"
          value={totalStudents.toLocaleString()}
          icon={GraduationCap}
          iconClassName="bg-tertiary/15 text-tertiary-foreground"
          className="delay-75"
        />
        <StatCard
          label="Total Payment Profit"
          value={`₦${totalRevenue.toLocaleString()}`}
          icon={Banknote}
          iconClassName="bg-orange-100 text-orange-500"
          className="delay-150"
        />
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-2 delay-200 fill-mode-both duration-500">
        <CardHeader>
          <CardTitle className="text-primary">
            Recent Added Institutions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name of Institution</TableHead>
                <TableHead>Number of Modules</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((institution) => (
                <TableRow key={institution.id}>
                  <TableCell>
                    <Link
                      href="/super-admin/institutions"
                      className="font-medium text-secondary hover:underline"
                    >
                      {institution.name}
                    </Link>
                  </TableCell>
                  <TableCell>{institution.modulesCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateLabel(new Date(institution.createdAt))}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium capitalize",
                        institution.status === "active"
                          ? "text-emerald-600"
                          : "text-destructive",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          institution.status === "active"
                            ? "bg-emerald-500"
                            : "bg-destructive",
                        )}
                      />
                      {institution.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <footer className="pt-2 text-center text-xs text-muted-foreground">
        Copyright &copy; {new Date().getFullYear()}. All Rights Reserved -
        Powered by Turon Technologies Limited.
      </footer>
    </div>
  );
}
