"use client"

import { useEffect, useRef, useState } from "react"
import * as $3Dmol from "3dmol"
import { Button } from "@/components/ui/button"
import { Pause, Play } from "lucide-react"
import { useDockingStore } from "@/store/docking-store"
import { generateConf } from "@/lib/api";

const ThreeDmolFrame = () => {
  const viewerRef = useRef<$3Dmol.GLViewer | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { getCurrentJob, setCurrentSdf, refreshCurrentJobThumbnail } = useDockingStore()
  const [isSpinning, setIsSpinning] = useState(false)
  const [currentModel, setCurrentModel] = useState("Molecule Editor")
  const currentJob = getCurrentJob()


  useEffect(() => {
    if (!viewerRef.current) return
    if (!currentJob) {
      viewerRef.current.clear()
      return
    }

    async function getConf() {
      let conformer = null

      try {

        viewerRef.current!.clear()

        switch (true) {
          case (currentJob!.best_complex_nr !== null):
            const url = `${process.env.NEXT_PUBLIC_API_URL}/static/poses/${currentJob?.job_id}_${currentJob?.best_complex_nr}.pdb`;
            const response = await fetch(url);
            if (!response.ok) {
              return
            } else {
              const pdbText = await response.text();
              viewerRef.current!.addModel(pdbText, 'pdb')
              viewerRef.current!.setStyle({chain: 'A'}, {cartoon: {color: 'orange'}});
              viewerRef.current!.setStyle({chain: 'B'}, {stick: {color: 'green'}});
              setCurrentModel("Best Complex (Index " + currentJob!.best_complex_nr + ")")
              break
            }

          case (!!currentJob!.sdf):
            conformer = {sdf: currentJob!.sdf,}
            viewerRef.current!.addModel(conformer.sdf, 'sdf')
            viewerRef.current!.setStyle({'stick': {'color': 'spectrum'}})
            setCurrentModel("Molecule Editor")
            break;

          default:
            conformer = await generateConf(currentJob!.smiles, currentJob!.job_id)
            setCurrentSdf(conformer)
            viewerRef.current!.addModel(conformer.sdf, 'sdf')
            viewerRef.current!.setStyle({'stick': {'color': 'spectrum'}})
            setCurrentModel("Molecule Editor")

        }

        viewerRef.current!.zoomTo()
        viewerRef.current!.render()

      } catch (error) {
          console.error("Error loading conformer in 3DMol viewer:", error)
      }

    }

    getConf()
    refreshCurrentJobThumbnail();

  }, [currentJob?.job_id, currentJob?.best_complex_nr, currentJob?.sdf, currentJob?.smiles])

  const toggleSpin = () => {
    if (!viewerRef.current) return

    if (isSpinning) {
      viewerRef.current.spin(false)
      setIsSpinning(false)
    } else {
      viewerRef.current.spin(true, 0.1)
      setIsSpinning(true)
    }
  }

    useEffect(() => {
      if (containerRef.current && !viewerRef.current) {
        try {
          const bg = getComputedStyle(document.documentElement)
              .getPropertyValue('--ketcher-canvas');
          viewerRef.current = $3Dmol.createViewer(containerRef.current,
            {
              defaultcolors: $3Dmol.elementColors.rasmol,
              backgroundColor: bg,
            }
          )
          viewerRef.current.zoomTo()
          viewerRef.current.render()
          viewerRef.current.setStyle({'stick': {'color': 'spectrum'}})
          // toggleSpin()
        } catch (error) {
          console.error("Error initializing 3DMol viewer:", error)
        }
      }
    }, []);

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
        <div className="text-sm p-1.5 px-2.5 bg-white rounded-md shadow">
          Current Model: {currentModel}
        </div>
        <Button variant="outline" className="size-8 cursor-pointer border-none shadow" onClick={toggleSpin}>
          {isSpinning ? <Pause /> : <Play />}
        </Button>
      </div>
      <div ref={containerRef} className="w-full h-full"/>
    </div>
  )
}

export default ThreeDmolFrame