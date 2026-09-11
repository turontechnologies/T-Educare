import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronsUpDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
 * "Password" style from the TEduCare login mockup. The label's background must
 * match whatever surface this sits on (see the `bg-muted` panel it's used in)
 * so the notch reads as a cut in the border rather than a mismatched patch —
 * pass `labelClassName` to override it on other surfaces (e.g. `bg-popover`
 * inside a dialog).
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

interface NotchedSelectFieldProps {
  label: string;
  labelClassName?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Same notched-label frame as `NotchedField`, but backed by the real
 * `Select` component (`components/ui/select.tsx`, base-ui) rather than a
 * native `<select>` — every dropdown in the app should render through this
 * (or `Select` directly, for a non-notched context like table toolbars)
 * rather than a bare `<select>`, so menus stay visually consistent instead
 * of falling back to raw OS chrome.
 */
export function NotchedSelectField({
  label,
  labelClassName,
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
}: NotchedSelectFieldProps) {
  return (
    <div className="relative">
      <Label
        className={cn(
          "absolute -top-2.5 left-3 z-10 bg-muted px-1.5 text-xs font-medium text-primary",
          labelClassName,
        )}
      >
        {label}
      </Label>
      <Select
        value={value === "" ? null : value}
        onValueChange={(next) => onValueChange(next ?? "")}
        disabled={disabled}
      >
        <SelectTrigger className="h-11 w-full justify-between rounded-md border-secondary/40 bg-transparent px-3.5 text-base font-normal outline-none focus-visible:border-secondary focus-visible:ring-secondary/30 data-placeholder:text-muted-foreground">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface NotchedDateFieldProps {
  label: string;
  labelClassName?: string;
  /** ISO date string ("yyyy-MM-dd" or a full ISO timestamp), or "" for no date selected. */
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Same notched-label frame as `NotchedField`/`NotchedSelectField`, backed by
 * the real `Calendar` component (`components/ui/calendar.tsx`, shadcn +
 * react-day-picker) in a `Popover` — every date input in the app should go
 * through this rather than a native `<input type="date">`, whose calendar
 * popup is unstyled OS chrome that can't be reused consistently.
 */
export function NotchedDateField({
  label,
  labelClassName,
  value,
  onValueChange,
  placeholder = "Select date",
  disabled,
}: NotchedDateFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? new Date(value) : undefined;

  return (
    <div className="relative">
      <Label
        className={cn(
          "absolute -top-2.5 left-3 z-10 bg-muted px-1.5 text-xs font-medium text-primary",
          labelClassName,
        )}
      >
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className="flex h-11 w-full items-center justify-between gap-2 rounded-md border border-secondary/40 bg-transparent px-3.5 text-base outline-none focus-visible:border-secondary focus-visible:ring-3 focus-visible:ring-secondary/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span
            className={cn(
              "min-w-0 truncate",
              !selectedDate && "text-muted-foreground",
            )}
          >
            {selectedDate ? format(selectedDate, "dd MMM yyyy") : placeholder}
          </span>
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              onValueChange(date ? format(date, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
          />
          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <button
              type="button"
              onClick={() => {
                onValueChange("");
                setOpen(false);
              }}
              className="cursor-pointer text-sm font-medium text-secondary hover:underline"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                onValueChange(format(new Date(), "yyyy-MM-dd"));
                setOpen(false);
              }}
              className="cursor-pointer text-sm font-medium text-secondary hover:underline"
            >
              Today
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface NotchedComboboxFieldProps {
  label: string;
  labelClassName?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
}

/**
 * Same notched-label frame as the other `Notched*Field`s, but a searchable
 * combobox (`Popover` + `Command`, cmdk) instead of a plain dropdown —
 * use this instead of `NotchedSelectField` whenever the option list is
 * long enough that scrolling to find one is worse than typing to filter
 * (institutions, states/countries, and similar — anywhere the list carries
 * "a lot of information"). Short, fixed lists (gender, a handful of
 * statuses) are still better served by `NotchedSelectField`.
 */
export function NotchedComboboxField({
  label,
  labelClassName,
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results found.",
  disabled,
}: NotchedComboboxFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <div className="relative">
      <Label
        className={cn(
          "absolute -top-2.5 left-3 z-10 bg-muted px-1.5 text-xs font-medium text-primary",
          labelClassName,
        )}
      >
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className="flex h-11 w-full items-center justify-between rounded-md border border-secondary/40 bg-transparent px-3.5 text-base outline-none focus-visible:border-secondary focus-visible:ring-3 focus-visible:ring-secondary/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span
            className={cn(
              "truncate text-left",
              !selected && "text-muted-foreground",
            )}
          >
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    data-checked={option.value === value ? "true" : undefined}
                    onSelect={() => {
                      onValueChange(option.value);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
