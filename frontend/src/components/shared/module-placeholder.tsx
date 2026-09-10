import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

interface ModulePlaceholderProps {
  breadcrumb: string[];
  title: string;
  description: string;
  icon: LucideIcon;
}

export function ModulePlaceholder({
  breadcrumb,
  title,
  description,
  icon: Icon,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={breadcrumb} />
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-xl font-semibold text-primary">{title}</h1>
        <Card className="mt-4">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <Icon className="size-6" />
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              {description}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
