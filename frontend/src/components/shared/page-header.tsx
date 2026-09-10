import { Calendar, Clock } from "lucide-react";

interface PageHeaderProps {
  breadcrumb: string[];
}

const todayLabel = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
}).format(new Date());

export function PageHeader({ breadcrumb }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {breadcrumb.map((crumb, index) => (
          <span key={crumb}>
            {index === 0 ? (
              <span className="font-medium text-foreground">{crumb}</span>
            ) : (
              crumb
            )}
            {index < breadcrumb.length - 1 && (
              <span className="mx-1.5">&gt;</span>
            )}
          </span>
        ))}
      </p>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" />
          Last Login: {todayLabel}
        </span>
        <span className="h-3.5 w-px bg-border" />
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="size-3.5" />
          Today&apos;s Date: {todayLabel}
        </span>
      </div>
    </div>
  );
}
