import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 transition-shadow hover:shadow-md",
        className,
      )}
    >
      <CardContent className="group flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs leading-snug font-medium text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110",
            iconClassName,
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
