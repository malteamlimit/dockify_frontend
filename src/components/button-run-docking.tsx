import React from "react";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
    ToggleGroup,
    ToggleGroupItem
} from "@/components/ui/toggle-group"
import {ChevronDown, RotateCw} from "lucide-react";

import {toast} from "sonner";
import {useDockingStore} from "@/store/docking-store";

export function ButtonRunDocking({variant = "new", disabled = false}: { variant?: "new" | "rerun", disabled?: boolean }) {
    const state = useDockingStore();
    const [name, setName] = React.useState("")
    const [runs, setRuns] = React.useState<string | null>(null)
    const [customRuns, setCustomRuns] = React.useState("")
    const [open, setOpen] = React.useState(false)
    const job = state.getCurrentJob() ?? {name: ""}

    const isValid = name.trim() !== "" &&
      (runs !== null && runs !== "x" || (runs === "x" && /^\d{1,3}$/.test(customRuns) && parseInt(customRuns) > 0))

    React.useEffect(() => {
      setName(job.name);
    }, [job.name]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setName(newValue)
    }

    const handleRun = () => {
      if (isValid) {
        const runsValue = runs === "x" ? parseInt(customRuns) : parseInt(runs || "0")
        useDockingStore.getState().runDocking(name, runsValue)
          .then(() => {
            setOpen(false)
          })
          .catch(() => {
            toast.error("There was an error. Please try again later. :(")
          })
        setOpen(false)
      }
    }

    React.useEffect(() => {
      if (!open) {
        setTimeout(() => {
          setName(job.name);
        }, 100);
      }
    }, [job.name, open])


    return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button disabled={disabled}>
                {variant === "new" ? "Start new Docking" : "Extend with more Runs"} <ChevronDown/>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 me-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="leading-none font-medium">Docking</h4>
                <p className="text-muted-foreground text-sm">
                  Let&#39;s dock our designed structure{variant === "new" ? null : " (again)"}!
                </p>
              </div>
              <div className="grid gap-2">
                  {variant === "new" ? (<div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="My fancy structure"
                    className={`col-span-2 h-8 ${name.trim() === "" ? "border-destructive focus-visible:ring-destructive/50" : ""}`}
                  />
                </div>) : null}
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="runs">Runs</Label>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={runs || ""}
                    onValueChange={(value) => {
                      if (value) setRuns(value);
                    }}
                    className="w-full shadow-xs col-span-2 h-8"
                  >
                    <ToggleGroupItem className="h-8" value="5">5</ToggleGroupItem>
                    <ToggleGroupItem className="h-8" value="10">10</ToggleGroupItem>
                    <ToggleGroupItem className="h-8" value="30">30</ToggleGroupItem>
                    <ToggleGroupItem className="h-8" value="x">
                      <Input
                        id="runs"
                        type="text"
                        value={customRuns}
                        onChange={(e) => setCustomRuns(e.target.value)}
                        placeholder="__"
                        className="h-8 p-0 text-center border-none shadow-none focus-visible:border-none focus-visible:ring-0"
                      />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
              <Button
                className="w-full"
                disabled={!isValid}
                onClick={handleRun}
              >
                  {variant === "new" ? "Run" : "Rerun"} {variant === "new" ? null : <RotateCw />}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
    )
}