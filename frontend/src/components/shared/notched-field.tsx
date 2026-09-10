import { useId, type ComponentProps, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface NotchedFieldProps extends Omit<ComponentProps<"input">, "id"> {
  label: string;
  error?: string;
  endAdornment?: ReactNode;
}

/**
 * Outlined field with the label notched into the top border — the "Username" /
 * "Password" style from the TEduCare login mockup. The label's background must
 * match whatever surface this sits on (see the `bg-muted` panel it's used in)
 * so the notch reads as a cut in the border rather than a mismatched patch.
 */
export function NotchedField({
  label,
  error,
  endAdornment,
  className,
  ...props
}: NotchedFieldProps) {
  const inputId = useId();

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Label
          htmlFor={inputId}
          className="absolute -top-2.5 left-3 z-10 bg-muted px-1.5 text-xs font-medium text-primary"
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
