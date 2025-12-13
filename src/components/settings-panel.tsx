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
  HardDriveUpload
} from "lucide-react"

export function SettingsPanel() {
  const [isExporting, setIsExporting] = React.useState(false)
  const [isImporting, setIsImporting] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const fetchJobs = useDockingStore((state) => state.fetchJobs)

  const [isResetOpen, setIsResetOpen] = React.useState(false)

  const qedThreshold = useSettingsStore((state) => state.qedThreshold);
  const enforceSubstructure = useSettingsStore((state) => state.enforceSubstructure);
  const { setQedThreshold, setEnforceSubstructure } = useSettingsStore()

  const incrementQed = () => {
    const newValue = Math.min(1, qedThreshold + 0.05);
    setQedThreshold(Number(newValue.toFixed(2)));
  };

  const decrementQed = () => {
    const newValue = Math.max(0, qedThreshold - 0.05);
    setQedThreshold(Number(newValue.toFixed(2)));
  };

  // handle db export for backup purposes
  const handleExport = () => {
    setIsExporting(true)
    exportDatabase().then((value) => {
      const dateStr = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '')
      const name = `dockify_database_${dateStr}.db`
      downloadBlob(value, name)
    })
        .catch((e: Error) => toast.error('Error: ' + e.message))
        .finally(() => setIsExporting(false))
  }

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
              accept=".db"
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
                      value={qedThreshold}
                      onChange={(e) => setQedThreshold(Number(e.target.value))}
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
            <FieldSeparator>Violation Settings</FieldSeparator>
            <Field orientation="vertical">
              <FieldContent>
                <FieldLabel htmlFor="dg-violation">Delta G</FieldLabel>
                <FieldDescription>Changing this accepts docking results with higher Delta G values, without marking them
                  as violations.</FieldDescription>
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
                      max={0}
                      defaultValue={0}
                      size={3}
                      className="h-8 !w-16 font-mono no-spinner"
                  />
                </InputGroup>
                <Button
                    variant="outline"
                    size="icon-sm"
                    type="button"
                    className="h-9"
                    aria-label="Decrement"
                >
                  <Minus/>
                </Button>
                <Button
                    variant="outline"
                    size="icon-sm"
                    type="button"
                    className="h-9"
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
                <FieldDescription>This setting defines the maximum allowed distance deviation for atom pair
                  constraints.</FieldDescription>
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
                      defaultValue={15}
                      size={3}
                      className="h-8 !w-16 font-mono no-spinner"
                  />
                </InputGroup>
                <Button
                    variant="outline"
                    size="icon-sm"
                    type="button"
                    className="h-9"
                    aria-label="Decrement"
                >
                  <Minus/>
                </Button>
                <Button
                    variant="outline"
                    size="icon-sm"
                    type="button"
                    className="h-9"
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
                <FieldDescription>Export the current structures and calculations to a database file.</FieldDescription>
              </FieldContent>
              <div className="flex gap-2">
                <Button
                    variant="outline"
                    type="button"
                    className="flex-1 h-9 grow"
                    onClick={handleExport}
                    disabled={isExporting}
                >
                  <HardDriveDownload/>
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
                <Button
                    variant="outline"
                    type="button"
                    className="flex-1 h-9 grow"
                    onClick={handleImport}
                    disabled={isImporting}
                ><HardDriveUpload/>
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