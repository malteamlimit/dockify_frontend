"use client"

import Image from "next/image";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDockingStore } from "@/store/docking-store";
import { useTargetStore } from "@/store/target-store";

export function NoStructurePlaceholder() {
  const createJob = useDockingStore((state) => state.createJob);
  const isLoading = useDockingStore((state) => state.isLoading);
  const isCreatingJob = useDockingStore((state) => state.isCreatingJob);
  const activeTarget = useTargetStore((state) => state.activeTarget);

  const isBusy = isLoading || isCreatingJob;

  const handleCreate = () => {
    createJob().catch(() => toast.error("Could not create a new structure. Please try again."));
  };

  return (
    <Card className="h-full w-full p-0 shadow-none overflow-hidden">
      <div className="h-full w-full flex flex-col items-center justify-center gap-1 px-8">
        {isBusy ? (
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        ) : (
          <>
            <Image
              src="/dna_broken.svg"
              alt="broken dna icon"
              width={80}
              height={80}
              className="mb-4 rotate-45"
            />
            <p className="text-sm text-center text-muted-foreground">No structures found.<br />Please start designing your molecule.</p>
            <Button variant="outline" className="mt-6 w-75" onClick={handleCreate} disabled={!activeTarget}>
              Create new structure <Plus/>
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
