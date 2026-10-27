"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { HostelAllocationsPanel } from "@/components/features/hostel/hostel-allocations-panel";
import { HostelsPanel } from "@/components/features/hostel/hostels-panel";
import { HostelWaitlistPanel } from "@/components/features/hostel/hostel-waitlist-panel";

export default function HostelManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Hostel Management"]} />

      <div>
        <h1 className="text-xl font-semibold text-primary">
          Hostel Management
        </h1>

        <Tabs defaultValue="hostels" className="mt-6">
          <TabsList variant="line">
            <TabsTrigger value="hostels">Hostels</TabsTrigger>
            <TabsTrigger value="allocations">Allocations</TabsTrigger>
            <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
          </TabsList>

          <TabsContent
            value="hostels"
            className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
          >
            <HostelsPanel />
          </TabsContent>

          <TabsContent
            value="allocations"
            className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
          >
            <HostelAllocationsPanel />
          </TabsContent>

          <TabsContent
            value="waitlist"
            className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
          >
            <HostelWaitlistPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
