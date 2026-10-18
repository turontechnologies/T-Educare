"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { LeaveBalancesPanel } from "@/components/features/leave/leave-balances-panel";
import { LeaveRequestsPanel } from "@/components/features/leave/leave-requests-panel";
import { LeaveTypesPanel } from "@/components/features/leave/leave-types-panel";
import { MyLeaveView } from "@/components/features/leave/my-leave-view";
import { useAuthStore } from "@/store/auth.store";

export default function LeaveManagementPage() {
  const staffId = useAuthStore((state) => state.user?.staffId);

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Staff Management"]} />

      <div>
        <h1 className="text-xl font-semibold text-primary">Leave Management</h1>

        {staffId ? (
          <div className="mt-6">
            <MyLeaveView />
          </div>
        ) : (
          <AdminLeaveManagement />
        )}
      </div>
    </div>
  );
}

function AdminLeaveManagement() {
  return (
    <Tabs defaultValue="requests" className="mt-6">
      <TabsList variant="line">
        <TabsTrigger value="requests">Requests</TabsTrigger>
        <TabsTrigger value="types">Types &amp; Policy</TabsTrigger>
        <TabsTrigger value="balances">Balances</TabsTrigger>
      </TabsList>

      <TabsContent
        value="requests"
        className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
      >
        <LeaveRequestsPanel />
      </TabsContent>

      <TabsContent
        value="types"
        className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
      >
        <LeaveTypesPanel />
      </TabsContent>

      <TabsContent
        value="balances"
        className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
      >
        <LeaveBalancesPanel />
      </TabsContent>
    </Tabs>
  );
}
