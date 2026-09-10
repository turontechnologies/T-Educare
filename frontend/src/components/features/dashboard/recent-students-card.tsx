import { User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RecentStudent {
  name: string;
  registeredAt: string;
}

const RECENT_STUDENTS: RecentStudent[] = [
  { name: "Amaka Chukwu", registeredAt: "Today · 9:12 AM" },
  { name: "Daniel Okafor", registeredAt: "Today · 8:47 AM" },
  { name: "Fatima Bello", registeredAt: "Yesterday · 4:30 PM" },
  { name: "Michael Adeyemi", registeredAt: "Yesterday · 2:05 PM" },
];

export function RecentStudentsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">
          Recent registered students
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {RECENT_STUDENTS.map((student) => (
          <div key={student.name} className="flex items-center gap-3">
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
                Registered {student.registeredAt}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="justify-center border-t-0 bg-transparent pt-0">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-tertiary text-primary hover:bg-tertiary/10"
        >
          View All
        </Button>
      </CardFooter>
    </Card>
  );
}
