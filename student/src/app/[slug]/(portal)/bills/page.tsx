"use client";

import { BillsCard } from "@/components/features/dashboard/bills-card";

export default function StudentBillsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">My Bills</h1>
        <p className="text-sm text-muted-foreground">
          Review your charges and settle any outstanding balance.
        </p>
      </div>

      <BillsCard />
    </div>
  );
}
