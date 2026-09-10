import type { NavItem } from "@/config/nav";
import { Checkbox } from "@/components/ui/checkbox";

interface MenuAccessTreeProps {
  items: NavItem[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export function MenuAccessTree({
  items,
  selected,
  onChange,
}: MenuAccessTreeProps) {
  const set = new Set(selected);

  const toggleLeaf = (key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(Array.from(next));
  };

  const toggleParent = (item: NavItem) => {
    const allKeys = [
      item.key,
      ...(item.children?.map((child) => child.key) ?? []),
    ];
    const allChecked = allKeys.every((key) => set.has(key));
    const next = new Set(set);
    allKeys.forEach((key) => (allChecked ? next.delete(key) : next.add(key)));
    onChange(Array.from(next));
  };

  return (
    <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-border p-3">
      {items.map((item) => {
        const Icon = item.icon;

        if (item.children && item.children.length > 0) {
          const allKeys = [
            item.key,
            ...item.children.map((child) => child.key),
          ];
          const allChecked = allKeys.every((key) => set.has(key));
          return (
            <div key={item.key}>
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-muted">
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={() => toggleParent(item)}
                />
                <Icon className="size-4 text-muted-foreground" />
                {item.label}
              </label>
              <div className="mt-0.5 mb-1 ml-6 space-y-0.5 border-l border-border pl-3">
                {item.children.map((child) => (
                  <label
                    key={child.key}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted"
                  >
                    <Checkbox
                      checked={set.has(child.key)}
                      onCheckedChange={() => toggleLeaf(child.key)}
                    />
                    {child.label}
                  </label>
                ))}
              </div>
            </div>
          );
        }

        return (
          <label
            key={item.key}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Checkbox
              checked={set.has(item.key)}
              onCheckedChange={() => toggleLeaf(item.key)}
            />
            <Icon className="size-4 text-muted-foreground" />
            {item.label}
          </label>
        );
      })}
    </div>
  );
}
