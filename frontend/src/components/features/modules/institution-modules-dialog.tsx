"use client";

import { useMemo, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { NotchedComboboxField } from "@/components/shared/notched-field";
import { PLATFORM_MODULES } from "@/config/modules";
import { notifyInstitution, notifyPlatform } from "@/lib/notify";
import { useInstitutionsStore } from "@/store/institutions.store";

interface InstitutionModulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an already-linked institution's modules. */
  institutionId?: string;
}

export function InstitutionModulesDialog({
  open,
  onOpenChange,
  institutionId,
}: InstitutionModulesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-xl gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {institutionId
              ? "Edit Institution Link"
              : "Add New Institution Link"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "add" and "edit — institution X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <InstitutionModulesForm
            key={institutionId ?? "new"}
            institutionId={institutionId}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function InstitutionModulesForm({
  institutionId,
  onDone,
}: {
  institutionId?: string;
  onDone: () => void;
}) {
  const institutions = useInstitutionsStore((state) => state.institutions);
  const updateInstitution = useInstitutionsStore(
    (state) => state.updateInstitution,
  );

  const isEditing = !!institutionId;

  // "Link New Institution" only ever offers institutions that haven't been
  // linked yet — an already-linked one is edited by clicking its name in the
  // table instead, not re-selected from here.
  const unlinkedInstitutions = useMemo(
    () =>
      institutions.filter(
        (institution) =>
          !institution.archivedAt && institution.moduleKeys.length === 0,
      ),
    [institutions],
  );

  const initialInstitution = institutionId
    ? institutions.find((institution) => institution.id === institutionId)
    : undefined;

  const [selectedId, setSelectedId] = useState(institutionId ?? "");
  const [addedInstitution, setAddedInstitution] = useState(initialInstitution);
  const [moduleKeys, setModuleKeys] = useState<Set<string>>(
    new Set(initialInstitution?.moduleKeys ?? []),
  );

  const allSelected = moduleKeys.size === PLATFORM_MODULES.length;

  const toggleModule = (key: string, checked: boolean) => {
    setModuleKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setModuleKeys(
      checked
        ? new Set(PLATFORM_MODULES.map((module) => module.key))
        : new Set(),
    );
  };

  const handleAdd = () => {
    const institution = unlinkedInstitutions.find((i) => i.id === selectedId);
    if (!institution) {
      toast.error("Select an institution first");
      return;
    }
    setAddedInstitution(institution);
    setModuleKeys(new Set(institution.moduleKeys));
  };

  const handleRemove = () => {
    setAddedInstitution(undefined);
    setSelectedId("");
    setModuleKeys(new Set());
  };

  const handleSave = () => {
    if (!addedInstitution) {
      toast.error("Select and add an institution first");
      return;
    }
    updateInstitution(addedInstitution.id, {
      moduleKeys: Array.from(moduleKeys),
      modulesCount: moduleKeys.size,
      modulesLastEditedAt: new Date().toISOString(),
      status: "active",
    });
    toast.success(`${addedInstitution.name}'s modules saved`);
    notifyPlatform(
      "Modules updated",
      `${addedInstitution.name} now has ${moduleKeys.size} module${moduleKeys.size === 1 ? "" : "s"} active.`,
      "/super-admin/modules",
    );
    notifyInstitution(
      addedInstitution.id,
      "Your modules were updated",
      `Your institution now has ${moduleKeys.size} module${moduleKeys.size === 1 ? "" : "s"} active.`,
    );
    onDone();
  };

  return (
    <>
      <div className="max-h-[65vh] space-y-5 overflow-y-auto p-6">
        {isEditing ? (
          <div className="rounded-md bg-secondary/5 px-3 py-2.5">
            <p className="text-sm font-medium text-secondary">
              Editing modules for {addedInstitution?.name}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <NotchedComboboxField
                  label="Select an Institution"
                  labelClassName="bg-popover"
                  value={selectedId}
                  onValueChange={setSelectedId}
                  options={unlinkedInstitutions.map((institution) => ({
                    label: institution.name,
                    value: institution.id,
                  }))}
                  placeholder={
                    unlinkedInstitutions.length === 0
                      ? "No institutions left to link"
                      : "Select institution"
                  }
                  searchPlaceholder="Search institutions…"
                  emptyText="No institution found."
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAdd}
                disabled={unlinkedInstitutions.length === 0}
                className="h-11 cursor-pointer rounded-md"
              >
                Add
              </Button>
            </div>

            {addedInstitution && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-secondary/5 px-3 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <p className="text-sm font-medium text-secondary">
                  {addedInstitution.name} is been selected and made active
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  className="rounded-full border-destructive text-destructive hover:bg-destructive/10"
                >
                  Remove
                </Button>
              </div>
            )}
          </>
        )}

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-sm font-medium text-foreground">
            Select the modules/features to be activated for the selected
            Institution
          </p>
          <div className="rounded-md border border-border">
            <label className="flex cursor-pointer items-center gap-2.5 border-b border-border bg-muted px-3 py-2.5">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              <span className="text-sm font-medium">Select All Modules</span>
            </label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-3 sm:grid-cols-4">
              {PLATFORM_MODULES.map((module) => (
                <label
                  key={module.key}
                  className="flex cursor-pointer items-center gap-2.5 text-sm"
                >
                  <Checkbox
                    checked={moduleKeys.has(module.key)}
                    onCheckedChange={(checked) =>
                      toggleModule(module.key, checked)
                    }
                  />
                  {module.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          onClick={handleSave}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Save Module
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
