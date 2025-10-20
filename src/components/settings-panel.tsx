"use client"
import * as React from "react"
import {
  Plus,
  Minus,
  Trash2,
  HardDriveDownload,
  HardDriveUpload
} from "lucide-react"
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch"


export function SettingsPanel() {
  return (
    <FieldSet className={"pb-8"}>
      <FieldGroup className={'pt-4'}>
        <FieldSeparator>Threshold Settings</FieldSeparator>
        <Field orientation="vertical">
          <FieldContent>
            <FieldLabel htmlFor="qed-threshold">QED</FieldLabel>
            <FieldDescription>Changing this allows you to dock structures with lower QED scores.</FieldDescription>
          </FieldContent>
          <ButtonGroup>
            <InputGroup>
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
                defaultValue={0.4}
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
              <Minus />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              type="button"
              className="h-9"
              aria-label="Increment"
            >
              <Plus />
            </Button>
          </ButtonGroup>
        </Field>
        <FieldSeparator />
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="substructure">Enforce substructure</FieldLabel>
            <FieldDescription>
              Toggle to enforce the presence of the required substructure in the docked molecules.
            </FieldDescription>
          </FieldContent>
          <Switch id="substructure" defaultChecked />
        </Field>
      </FieldGroup>
      <FieldGroup className={'pt-8'}>
        <FieldSeparator >Violation Settings</FieldSeparator>
        <Field orientation="vertical">
          <FieldContent>
            <FieldLabel htmlFor="dg-violation">Delta G</FieldLabel>
            <FieldDescription>Changing this accepts docking results with higher Delta G values, without marking them as violations.</FieldDescription>
          </FieldContent>
          <ButtonGroup>
            <InputGroup>
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
              <Minus />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              type="button"
              className="h-9"
              aria-label="Increment"
            >
              <Plus />
            </Button>
          </ButtonGroup>
        </Field>
        <FieldSeparator />
        <Field orientation="vertical">
          <FieldContent>
            <FieldLabel htmlFor="apc-violation">Atom Pair Constraint</FieldLabel>
            <FieldDescription>This setting defines the maximum allowed distance deviation for atom pair constraints.</FieldDescription>
          </FieldContent>
          <ButtonGroup>
            <InputGroup>
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
              <Minus />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              type="button"
              className="h-9"
              aria-label="Increment"
            >
              <Plus />
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
                className="h-9 grow"
            ><HardDriveDownload/> Export</Button>
            <Button
                variant="outline"
                type="button"
                className="h-9 grow"
            ><HardDriveUpload/> Import</Button>
          </div>
        </Field>
        <FieldSeparator />
        <Field orientation="vertical">
          <FieldContent>
            <FieldLabel>Reset All Data</FieldLabel>
            <FieldDescription>This will delete all structures and calculations from the database. This action cannot be undone.</FieldDescription>
          </FieldContent>
          <Button
              variant="destructive"
              type="button"
              className="h-9 grow"
          ><Trash2/>Reset Database</Button>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}