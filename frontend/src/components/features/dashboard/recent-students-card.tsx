"use client";

import { useRouter } from "next/navigation";
import { User, UserRoundSearch } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRecentStudents } from "@/hooks/use-dashboard";

const registeredAtFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

function formatRegisteredAt(iso: string) {
  const hours = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 24) return registeredAtFormatter.format(-hours, "hour");
  return registeredAtFormatter.format(-Math.round(hours / 24), "day");
}

export function RecentStudentsCard() {
  const router = useRouter();
  const { data: recentStudents = [] } = useRecentStudents(4);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">
          Recent registered students
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentStudents.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
            <UserRoundSearch className="size-8" />
            <p className="text-sm">No students registered yet.</p>
          </div>
        ) : (
          recentStudents.map((student) => (
            <div key={student.id} className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <User className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {student.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Registered {formatRegisteredAt(student.registeredAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
      <CardFooter className="justify-center border-t-0 bg-transparent pt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/students")}
          className="rounded-full border-tertiary text-primary hover:bg-tertiary/10"
        >
          View All
        </Button>
      </CardFooter>
    </Card>
  );
}
