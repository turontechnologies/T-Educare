import { useId, type ComponentProps, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface NotchedFieldProps extends Omit<ComponentProps<"input">, "id"> {
  label: string;
  error?: string;
  endAdornment?: ReactNode;
  /** Override the label cutout's background — must match whatever surface the field sits on. Defaults to `bg-muted`. */
  labelClassName?: string;
}

/**
 * Outlined field with the label notched into the top border — the "Username" /
 * "Password" style from the TEduCare login mockup, same component as the
 * admin app's `src/components/shared/notched-field.tsx` (trimmed here to
 * just the plain-input variant — this app has no selects/comboboxes yet).
 */
export function NotchedField({
  label,
  error,
  endAdornment,
  className,
  labelClassName,
  ...props
}: NotchedFieldProps) {
  const inputId = useId();

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Label
          htmlFor={inputId}
          className={cn(
            "absolute -top-2.5 left-3 z-10 bg-muted px-1.5 text-xs font-medium text-primary",
            labelClassName,
          )}
        >
          {label}
        </Label>
        <Input
          id={inputId}
          aria-invalid={!!error}
          className={cn(
            "h-11 rounded-md border border-secondary/40 bg-transparent px-3.5 text-base focus-visible:border-secondary focus-visible:ring-secondary/30",
            endAdornment && "pr-11",
            className,
          )}
          {...props}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {endAdornment}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
