"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Minus, Plus } from "lucide-react";

import { DockingJob } from "@/app/models";
import { useDockingStore } from "@/store/docking-store";
import { useSettingsStore } from "@/store/settings-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

/**
 * Dialog for editing a single job's violation thresholds.
 *
 * Applying the change calls the backend, which re-analyzes the job's existing
 * poses (best valid run + RMSD) without re-docking.
 */
export function JobThresholdsDialog({
  job,
  open,
  onOpenChange,
}: {
  job: DockingJob;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateThresholds = useDockingStore((state) => state.updateThresholds);
  // Global default thresholds (configured in the sidebar settings panel)
  const defaultDeltaG = useSettingsStore((state) => state.deltaGThreshold);
  const defaultAtomPairCst = useSettingsStore((state) => state.atomPairCstThreshold);

  // The inputs are kept as strings so the field can be cleared or hold an
  // intermediate value (e.g. "-" or "") while typing. They are parsed to
  // numbers only for validation and when applying.
  const [deltaG, setDeltaG] = React.useState(String(job.delta_g_threshold));
  const [atomPairCst, setAtomPairCst] = React.useState(String(job.atom_pair_cst_threshold));
  const [isApplying, setIsApplying] = React.useState(false);

  // Reset the inputs to the job's stored values whenever the dialog opens
  React.useEffect(() => {
    if (open) {
      setDeltaG(String(job.delta_g_threshold));
      setAtomPairCst(String(job.atom_pair_cst_threshold));
    }
  }, [open, job.delta_g_threshold, job.atom_pair_cst_threshold]);

  const deltaGNum = parseFloat(deltaG);
  const atomPairCstNum = parseFloat(atomPairCst);
  const deltaGValid = Number.isFinite(deltaGNum);
  const atomPairCstValid = Number.isFinite(atomPairCstNum) && atomPairCstNum >= 0;

  const hasChanges =
    deltaGValid &&
    atomPairCstValid &&
    (deltaGNum !== job.delta_g_threshold || atomPairCstNum !== job.atom_pair_cst_threshold);

  const isAtDefaults = deltaGNum === defaultDeltaG && atomPairCstNum === defaultAtomPairCst;

  const stepDeltaG = (delta: number) => {
    const base = deltaGValid ? deltaGNum : job.delta_g_threshold;
    setDeltaG(String(Number((base + delta).toFixed(1))));
  };
  const stepAtomPairCst = (delta: number) => {
    const base = atomPairCstValid ? atomPairCstNum : job.atom_pair_cst_threshold;
    setAtomPairCst(String(Number(Math.max(0, base + delta).toFixed(1))));
  };

  const handleApply = () => {
    setIsApplying(true);
    updateThresholds(job.job_id, deltaGNum, atomPairCstNum)
      .then(() => {
        toast.success("Violation thresholds updated.");
        onOpenChange(false);
      })
      .catch(() => toast.error("There was an error. Please try again later. :("))
      .finally(() => setIsApplying(false));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && hasChanges && !isApplying) {
      e.preventDefault();
      handleApply();
    }
  };

  // fills the inputs with the global defaults
  const handleReset = () => {
    setDeltaG(String(defaultDeltaG));
    setAtomPairCst(String(defaultAtomPairCst));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Violation Thresholds</DialogTitle>
          <DialogDescription>
            Runs that violate one of these thresholds do not count as successful results.
            Applying re-analyzes <span className="font-medium">{job.name}</span> without re-docking.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-2">
          <Field orientation="vertical">
            <FieldContent>
              <FieldLabel htmlFor="job-dg-threshold">Delta G</FieldLabel>
              <FieldDescription>Runs with a Delta G at or above this value count as a violation.</FieldDescription>
            </FieldContent>
            <ButtonGroup>
              <InputGroup className="bg-background">
                <InputGroupAddon>
                  <InputGroupText>max.</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="job-dg-threshold"
                  type="number"
                  inputMode="numeric"
                  step={0.1}
                  value={deltaG}
                  onChange={(e) => setDeltaG(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 !w-16 font-mono no-spinner"
                />
              </InputGroup>
              <Button
                variant="outline"
                size="icon-sm"
                type="button"
                className="h-9"
                onClick={() => stepDeltaG(-0.1)}
                aria-label="Decrement"
              >
                <Minus />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                type="button"
                className="h-9"
                onClick={() => stepDeltaG(0.1)}
                aria-label="Increment"
              >
                <Plus />
              </Button>
            </ButtonGroup>
          </Field>
          <Field orientation="vertical">
            <FieldContent>
              <FieldLabel htmlFor="job-apc-threshold">Atom Pair Constraint</FieldLabel>
              <FieldDescription>Runs with an atom pair constraint at or above this value count as a violation.</FieldDescription>
            </FieldContent>
            <ButtonGroup>
              <InputGroup className="bg-background">
                <InputGroupAddon>
                  <InputGroupText>max.</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="job-apc-threshold"
                  type="number"
                  inputMode="numeric"
                  step={0.5}
                  min={0}
                  value={atomPairCst}
                  onChange={(e) => setAtomPairCst(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 !w-16 font-mono no-spinner"
                />
              </InputGroup>
              <Button
                variant="outline"
                size="icon-sm"
                type="button"
                className="h-9"
                onClick={() => stepAtomPairCst(-0.5)}
                aria-label="Decrement"
              >
                <Minus />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                type="button"
                className="h-9"
                onClick={() => stepAtomPairCst(0.5)}
                aria-label="Increment"
              >
                <Plus />
              </Button>
            </ButtonGroup>
          </Field>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isApplying || isAtDefaults}
            className="sm:mr-auto"
          >
            Reset to defaults
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isApplying}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={isApplying || !hasChanges}>
            {isApplying ? <Loader2 className="animate-spin" /> : null}
            {isApplying ? "Re-analyzing..." : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}