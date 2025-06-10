import React from "react";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {toast} from "sonner";

import {DockingJob} from "@/app/models";
import {updateName} from "@/lib/api";
import {useDockingStore} from "@/store/docking-store";

export function TagNameAndRename({ job }: { job: DockingJob }) {
    const { setCurrentName } = useDockingStore();
    const [name, setName] = React.useState("")
    const [open, setOpen] = React.useState(false)
    const isValid = name?.trim() !== ""

    React.useEffect(() => {
      setName(job.name);
    }, [job.name]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setName(newValue)
    }

    const handleRename = async () => {
      if (isValid) {
        updateName(job.job_id, name).then(() => {
            setCurrentName(name)
            setOpen(false)
        })
          .catch(() => toast.error("There was an error. Please try again later. :("))
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && isValid) {
        handleRename();
      }
    };

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
            <div className="truncate pl-1 py-1 font-bold cursor-pointer hover:underline">
              {job.name}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-60 ms-4">
            <div className="grid gap-4">
              <div>
                <Input
                  id="name"
                  value={name}
                  onChange={handleNameChange}
                  onKeyDown={handleKeyDown}
                  placeholder="My fancy structure"
                  className={`h-8 ${name.trim() === "" ? "border-destructive focus-visible:ring-destructive/50" : ""}`}
                />
              </div>
              <Button
                className="w-full"
                disabled={!isValid}
                onClick={handleRename}
              >
                Save
              </Button>
            </div>
          </PopoverContent>
        </Popover>
    )
}