"use client"
import * as React from "react"
import {exportDatabase, importDatabase, resetDatabase} from "@/lib/api";
import {downloadBlob} from "@/lib/utils";
import {useDockingStore} from "@/store/docking-store";
import {useSettingsStore} from "@/store/settings-store";

import {toast} from "sonner";
import {Button, buttonVariants} from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
    FieldSet,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText
} from "@/components/ui/input-group"
import {Switch} from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Minus,
  Trash2,
  HardDriveDownload,
  HardDriveUpload,
  Loader2
} from "lucide-react"

export function SettingsPanel() {
  const [isExporting, setIsExporting] = React.useState(false)
  const [isImporting, setIsImporting] = React.useState(false)
  const [exportProgress, setExportProgress] = React.useState<{ received: number; total: number | null } | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const fetchJobs = useDockingStore((state) => state.fetchJobs)

  const [isResetOpen, setIsResetOpen] = React.useState(false)

  const qedThreshold = useSettingsStore((state) => state.qedThreshold);
  const enforceSubstructure = useSettingsStore((state) => state.enforceSubstructure);
  const deltaGThreshold = useSettingsStore((state) => state.deltaGThreshold);
  const atomPairCstThreshold = useSettingsStore((state) => state.atomPairCstThreshold);
  const { setQedThreshold, setEnforceSubstructure, setDeltaGThreshold, setAtomPairCstThreshold } = useSettingsStore()

  const incrementQed = () => {
    const newValue = Math.min(1, qedThreshold + 0.05);
    setQedThreshold(Number(newValue.toFixed(2)));
  };

  const decrementQed = () => {
    const newValue = Math.max(0, qedThreshold - 0.05);
    setQedThreshold(Number(newValue.toFixed(2)));
  };

  const incrementDeltaG = () => {
    setDeltaGThreshold(Number((deltaGThreshold + 0.1).toFixed(1)));
  };

  const decrementDeltaG = () => {
    setDeltaGThreshold(Number((deltaGThreshold - 0.1).toFixed(1)));
  };

  const incrementAtomPairCst = () => {
    setAtomPairCstThreshold(Number((atomPairCstThreshold + 0.5).toFixed(1)));
  };

  const decrementAtomPairCst = () => {
    const newValue = Math.max(0, atomPairCstThreshold - 0.5);
    setAtomPairCstThreshold(Number(newValue.toFixed(1)));
  };

  // local string state for the numeric inputs
  const [qedInput, setQedInput] = React.useState(String(qedThreshold));
  const [deltaGInput, setDeltaGInput] = React.useState(String(deltaGThreshold));
  const [atomPairCstInput, setAtomPairCstInput] = React.useState(String(atomPairCstThreshold));

  React.useEffect(() => { setQedInput(String(qedThreshold)); }, [qedThreshold]);
  React.useEffect(() => { setDeltaGInput(String(deltaGThreshold)); }, [deltaGThreshold]);
  React.useEffect(() => { setAtomPairCstInput(String(atomPairCstThreshold)); }, [atomPairCstThreshold]);

  const commitQed = () => {
    const n = parseFloat(qedInput);
    if (Number.isFinite(n)) {
      const v = Number(Math.min(1, Math.max(0, n)).toFixed(2));
      setQedThreshold(v);
      setQedInput(String(v));
    } else {
      setQedInput(String(qedThreshold));
    }
  };
  const commitDeltaG = () => {
    const n = parseFloat(deltaGInput);
    if (Number.isFinite(n)) {
      const v = Number(n.toFixed(1));
      setDeltaGThreshold(v);
      setDeltaGInput(String(v));
    } else {
      setDeltaGInput(String(deltaGThreshold));
    }
  };
  const commitAtomPairCst = () => {
    const n = parseFloat(atomPairCstInput);
    if (Number.isFinite(n)) {
      const v = Number(Math.max(0, n).toFixed(1));
      setAtomPairCstThreshold(v);
      setAtomPairCstInput(String(v));
    } else {
      setAtomPairCstInput(String(atomPairCstThreshold));
    }
  };

  const commitOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };

  // handle db export for backup purposes
  const handleExport = () => {
    setIsExporting(true)
    setExportProgress({ received: 0, total: null })
    exportDatabase((received, total) => {
      setExportProgress({ received, total })
    }).then((value) => {
      const dateStr = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '')
      const name = `dockify_backup_${dateStr}.zip`
      downloadBlob(value, name)
    })
        .catch((e: Error) => toast.error('Error: ' + e.message))
        .finally(() => {
          setIsExporting(false)
          setExportProgress(null)
        })
  }

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const exportLabel = (() => {
    if (!isExporting) return 'Export'
    if (!exportProgress || exportProgress.received === 0) return 'Preparing...'
    if (exportProgress.total) {
      const pct = Math.round((exportProgress.received / exportProgress.total) * 100)
      return `Exporting ${pct}%`
    }
    return `Exporting ${formatBytes(exportProgress.received)}`
  })()

  // handle db import for backup purposes
  const handleImport = () => {
    fileInputRef.current?.click()
  }

  // handle file change event for db import
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    importDatabase(file)
        .then(() => {
          toast.success('Database imported successfully')
          return fetchJobs()
        })
        .then(() => {
          // Select the latest job after import
          const jobs = useDockingStore.getState().jobs
          if (jobs.length > 0) {
            useDockingStore.getState().setCurrentJobId(jobs[jobs.length - 1].job_id)
          }

          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        })
        .catch((e) => toast.error('Error: ' + e.message))
        .finally(() => setIsImporting(false))
  }

  // handle resetting the database
  const handleReset = () => {
    resetDatabase()
        .then(() => {
          toast.success('Database successfully deleted')
          return fetchJobs()
        })
        .catch((e: Error) => toast.error('Error: ' + e.message))
        .finally(() => setIsExporting(false))
  }

  return (
      <div>
        <FieldSet className={"pb-8"}>
          {/* Hidden file input */}
          <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              style={{display: 'none'}}
          />
          <FieldGroup className={'pt-4'}>
            <FieldSeparator>Threshold Settings</FieldSeparator>
            <Field orientation="vertical">
              <FieldContent>
                <FieldLabel htmlFor="qed-threshold">QED</FieldLabel>
                <FieldDescription>Changing this allows you to dock structures with lower QED scores.</FieldDescription>
              </FieldContent>
              <ButtonGroup>
                <InputGroup className="bg-background">
                  <InputGroupAddon>
                    <InputGroupText>min.</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                      id="qed-threshold"
                      type="number"
                      inputMode={'numeric'}
                      step={0.05}
                      min={0}
                      max={1}
                      value={qedInput}
                      onChange={(e) => setQedInput(e.target.value)}
                      onBlur={commitQed}
                      onKeyDown={commitOnEnter}
                      size={3}
                      className="h-8 !w-16 font-mono no-spinner"
                  />
                </InputGroup>
                <Button
                    variant="outline"
                    size="icon-sm"
                    type="button"
                    className="h-9"
                    onClick={decrementQed}
                    aria-label="Decrement"
                >
                  <Minus/>
                </Button>
                <Button
                    variant="outline"
                    size="icon-sm"
                    type="button"
                    className="h-9"
                    onClick={incrementQed}
                    aria-label="Increment"
                >
                  <Plus/>
                </Button>
              </ButtonGroup>
            </Field>
            <FieldSeparator/>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="substructure">Enforce substructure</FieldLabel>
                <FieldDescription>
                  Toggle to enforce the presence of the required substructure in the docked molecules.
                </FieldDescription>
              </FieldContent>
              <Switch
                  id="substructure"
                  checked={enforceSubstructure}
                  onCheckedChange={setEnforceSubstructure}
              />
            </Field>
          </FieldGroup>
          <FieldGroup className={'pt-8'}>
            <FieldSeparator>Default Violation Thresholds</FieldSeparator>
            <Field orientation="vertical">
              <FieldContent>
                <FieldLabel htmlFor="dg-violation">Delta G</FieldLabel>
                <FieldDescription>Default for new structures. Docking results with a Delta G at or above this
                  value are marked as violations. Per-structure overrides are available from the job menu.</FieldDescription>
              </FieldContent>
              <ButtonGroup>
                <InputGroup className="bg-background">
                  <InputGroupAddon>
                    <InputGroupText>max.</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                      id="dg-violation"
                      type="number"
                      inputMode={'numeric'}
                      step={0.1}
                      value={deltaGInput}
                      onChange={(e) => setDeltaGInput(e.target.value)}
                      onBlur={commitDeltaG}
                      onKeyDown={commitOnEnter}
                      size={3}
                      className="h-8 !w-16 font-mono no-spinner"
                  />
                </InputGroup>
                <Button
                    variant="outline"
                    size="icon-sm"
                    type="button"
                    className="h-9"
                    onClick={decrementDeltaG}
                    aria-label="Decrement"
                >
                  <Minus/>
                </Button>
                <Button
                    variant="outline"
                    size="icon-sm"
                    type="button"
                    className="h-9"
                    onClick={incrementDeltaG}
                    aria-label="Increment"
                >
                  <Plus/>
                </Button>
              </ButtonGroup>
            </Field>
            <FieldSeparator/>
            <Field orientation="vertical">
              <FieldContent>
                <FieldLabel htmlFor="apc-violation">Atom Pair Constraint</FieldLabel>
                <FieldDescription>Default for new structures. Docking results with an atom pair constraint at or
                  above this value are marked as violations. Per-structure overrides are available from the job menu.</FieldDescription>
              </FieldContent>
              <ButtonGroup>
                <InputGroup className="bg-background">
                  <InputGroupAddon>
                    <InputGroupText>max.</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                      id="apc-violation"
                      type="number"
                      inputMode={'numeric'}
                      step={0.5}
                      min={0}
                      value={atomPairCstInput}
                      onChange={(e) => setAtomPairCstInput(e.target.value)}
                      onBlur={commitAtomPairCst}
                      onKeyDown={commitOnEnter}
                      size={3}
                      className="h-8 !w-16 font-mono no-spinner"
                  />
                </InputGroup>
                <Button
                    variant="outline"
                    size="icon-sm"
                    type="button"
                    className="h-9"
                    onClick={decrementAtomPairCst}
                    aria-label="Decrement"
                >
                  <Minus/>
                </Button>
                <Button
                    variant="outline"
                    size="icon-sm"
                    type="button"
                    className="h-9"
                    onClick={incrementAtomPairCst}
                    aria-label="Increment"
                >
                  <Plus/>
                </Button>
              </ButtonGroup>
            </Field>
          </FieldGroup>
          <FieldGroup className={'pt-8'}>
            <FieldSeparator>Database Settings</FieldSeparator>
            <Field orientation="vertical">
              <FieldContent>
                <FieldLabel>Database Backup</FieldLabel>
                <FieldDescription>Export the current structures, poses and calculations as a backup archive.</FieldDescription>
              </FieldContent>
              <div className="flex gap-2">
                <Button
                    variant="outline"
                    type="button"
                    className="flex-1 h-9 grow"
                    onClick={handleExport}
                    disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="animate-spin"/> : <HardDriveDownload/>}
                  {exportLabel}
                </Button>
                <Button
                    variant="outline"
                    type="button"
                    className="flex-1 h-9 grow"
                    onClick={handleImport}
                    disabled={isImporting}
                >
                  {isImporting ? <Loader2 className="animate-spin"/> : <HardDriveUpload/>}
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
              </div>
            </Field>
            <FieldSeparator/>
            <Field orientation="vertical">
              <FieldContent>
                <FieldLabel>Reset All Data</FieldLabel>
                <FieldDescription>This will delete all structures and calculations from the database. This action cannot
                  be undone.</FieldDescription>
              </FieldContent>
              <Button
                  variant="destructive"
                  type="button"
                  className="h-9 grow"
                  onClick={() => setIsResetOpen(true)}
              ><Trash2/>Reset Database</Button>
            </Field>
          </FieldGroup>
        </FieldSet>
        <AlertDialog open={isResetOpen} onOpenChange={setIsResetOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to delete <span className="font-bold">ALL structures and corresponding data</span>.<br/>
                This action cannot be undone. This will permanently delete the full database.<br/>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className={buttonVariants({variant: 'destructive'})} onClick={handleReset}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  )
}