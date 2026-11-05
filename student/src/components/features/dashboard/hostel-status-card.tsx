"use client";

import { Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHostelStatus } from "@/hooks/use-student-portal";

export function HostelStatusCard() {
  const { data, isLoading } = useHostelStatus(true);
  const allocated = !!data?.hostelName;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="size-4 text-primary" />
          Hostel
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : allocated ? (
          <div>
            <p className="text-lg font-semibold text-primary">
              {data.hostelName}
            </p>
            <p className="text-sm text-muted-foreground">
              Room {data.roomNumber}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t been allocated a hostel room yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
