"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, CheckCircle2 } from "lucide-react"
import {
  getTargets,
  getTargetPreviewUrl,
  selectTarget,
  type TargetInfo,
  type TargetSummary,
} from "@/lib/api"

// ---- Mini 3Dmol viewer for each target card ----
function TargetPreviewViewer({ pdbUrl }: { pdbUrl: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    let initialized = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let viewer: any = null

    const initViewer = async () => {
      // Only initialise once the container has real dimensions.
      // The dialog open-animation means clientWidth can be 0 on the first paint.
      if (initialized || cancelled || container.clientWidth === 0) return
      initialized = true

      try {
        const $3Dmol = await import("3dmol")
        if (cancelled) return

        viewer = $3Dmol.createViewer(container, {
          backgroundColor: "#f8fafc",
          defaultcolors: $3Dmol.elementColors.rasmol,
        })

        const pdbText = await fetch(pdbUrl).then((r) => r.text())
        if (cancelled || !viewer) return

        viewer.addModel(pdbText, "pdb")
        viewer.setStyle({ hetflag: false }, { cartoon: { color: "lightblue", opacity: 0.85 } })
        viewer.setStyle({ hetflag: true }, { stick: { colorscheme: "greenCarbon" }, sphere: { radius: 0.3 } })
        viewer.zoomTo({ hetflag: true })
        viewer.render()
      } catch {
        // Non-fatal: canvas may not be ready yet; ResizeObserver will retry.
      }
    }

    // Watch for the container to gain dimensions (dialog CSS transition).
    const observer = new ResizeObserver(() => {
      if (container.clientWidth > 0 && !initialized) initViewer()
    })
    observer.observe(container)

    // Also try immediately in case the container already has dimensions.
    initViewer()

    return () => {
      cancelled = true
      observer.disconnect()
      try { viewer?.clear() } catch { /* ignore */ }
    }
  }, [pdbUrl])

  return <div ref={containerRef} className="w-full h-full" />
}

// ---- Single target card ----
function TargetCard({
  target,
  onPreSelect,
  onConfirm,
  isPreSelected,
  isSelecting,
}: {
  target: TargetSummary
  onPreSelect: (id: string) => void
  onConfirm: (id: string) => void
  isPreSelected: boolean
  isSelecting: boolean
}) {
  const previewUrl = getTargetPreviewUrl(target.id)

  return (
    <Card
      className={`cursor-pointer pt-0 pb-4 transition-all overflow-hidden w-72 flex-shrink-0 ${
        isPreSelected
          ? "border-primary ring-2 ring-primary shadow-md"
          : "hover:border-primary hover:shadow-md"
      } ${isSelecting ? "opacity-60 pointer-events-none" : ""}`}
      onClick={() => onPreSelect(target.id)}
    >
      {/* Stop clicks from the 3D viewer bubbling up to card selection */}
      <div
        className="h-56 bg-slate-50 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <TargetPreviewViewer pdbUrl={previewUrl} />
        {isSelecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        )}
      </div>
      <CardContent className="px-4 pt-2 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base">{target.name}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="text-xs font-mono cursor-pointer hover:bg-accent transition-colors"
                  onClick={(e) => { e.stopPropagation(); window.open(`https://www.rcsb.org/structure/${target.pdb_code}`, '_blank') }}
                >
                  {target.pdb_code}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Open structure on RCSB PDB</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isPreSelected && (
            <CheckCircle2 className="ml-auto text-primary" size={16} />
          )}
        </div>
        <p className="text-xs text-muted-foreground font-medium">{target.full_name}</p>
        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
          {target.description}
        </p>
        <Button
          className={`w-full mt-6 h-8 text-xs cursor-pointer transition-none ${isPreSelected ? "" : "opacity-0 pointer-events-none"}`}
          onClick={(e) => { e.stopPropagation(); onConfirm(target.id) }}
        >
          Confirm this target
        </Button>
      </CardContent>
    </Card>
  )
}

// ---- Main dialog ----
export function TargetSelectionDialog({
  open,
  onSelect,
}: {
  open: boolean
  onSelect: (target: TargetInfo) => void
}) {
  const [targets, setTargets] = React.useState<TargetSummary[]>([])
  const [isLoadingTargets, setIsLoadingTargets] = React.useState(true)
  const [preSelectedId, setPreSelectedId] = React.useState<string | null>(null)
  const [selectingId, setSelectingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    setIsLoadingTargets(true)
    setPreSelectedId(null)
    getTargets()
      .then(setTargets)
      .catch(console.error)
      .finally(() => setIsLoadingTargets(false))
  }, [open])

  const handleConfirm = async (targetId: string) => {
    if (selectingId) return
    setSelectingId(targetId)
    try {
      const target = await selectTarget(targetId)
      onSelect(target)
    } catch (err) {
      console.error("Failed to select target:", err)
    } finally {
      setSelectingId(null)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="!w-fit !max-w-[95vw] max-h-[90vh] overflow-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center sm:text-center pb-2">
          <DialogTitle className="text-2xl font-bold">Welcome to Dockify</DialogTitle>
          <DialogDescription className="text-sm">
            Select a protein target to begin docking. This can be changed later by resetting the database.
          </DialogDescription>
        </DialogHeader>

        {isLoadingTargets ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-muted-foreground" size={36} />
          </div>
        ) : (
          <div className="flex flex-nowrap justify-center gap-4">
            {targets.map((target) => (
              <TargetCard
                key={target.id}
                target={target}
                onPreSelect={setPreSelectedId}
                onConfirm={handleConfirm}
                isPreSelected={preSelectedId === target.id}
                isSelecting={selectingId === target.id}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}