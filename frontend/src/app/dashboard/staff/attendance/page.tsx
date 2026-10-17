"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { AttendanceDevicesPanel } from "@/components/features/attendance/attendance-devices-panel";
import { AttendanceOverviewPanel } from "@/components/features/attendance/attendance-overview-panel";
import { AttendanceSettingsPanel } from "@/components/features/attendance/attendance-settings-panel";
import { MyAttendanceView } from "@/components/features/attendance/my-attendance-view";
import { useAuthStore } from "@/store/auth.store";

export default function AttendancePage() {
  const staffId = useAuthStore((state) => state.user?.staffId);

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Staff Management"]} />

      <div>
        <h1 className="text-xl font-semibold text-primary">
          Time &amp; Attendance
        </h1>

        {staffId ? (
          <div className="mt-6">
            <MyAttendanceView />
          </div>
        ) : (
          <AdminAttendanceManagement />
        )}
      </div>
    </div>
  );
}

function AdminAttendanceManagement() {
  return (
    <Tabs defaultValue="overview" className="mt-6">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="devices">Devices</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent
        value="overview"
        className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
      >
        <AttendanceOverviewPanel />
      </TabsContent>

      <TabsContent
        value="devices"
        className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
      >
        <AttendanceDevicesPanel />
      </TabsContent>

      <TabsContent
        value="settings"
        className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
      >
        <AttendanceSettingsPanel />
      </TabsContent>
    </Tabs>
  );
}
