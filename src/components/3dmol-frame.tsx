"use client"

import { useEffect, useRef, useState } from "react"
import * as $3Dmol from "3dmol"
import { Button } from "@/components/ui/button"
import { Pause, Play } from "lucide-react"
import { useDockingStore } from "@/store/docking-store"

const ThreeDmolFrame = () => {
  const viewerRef = useRef<$3Dmol.GLViewer | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const currentJob = useDockingStore(state => state.getCurrentJob());
  const { refreshCurrentJobThumbnail } = useDockingStore()

  const [isSpinning, setIsSpinning] = useState(false)
  const [currentModel, setCurrentModel] = useState("Molecule Editor")
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (!viewerRef.current) return
    if (!currentJob) return;

    const loadModel = async () => {
      viewerRef.current!.clear()
      setIsError(false)

      if (currentJob.best_complex_nr !== null) {
        try {
          const url = `${process.env.NEXT_PUBLIC_API_URL}/static/poses/${currentJob.job_id}_${currentJob.best_complex_nr}.pdb`;
          const response = await fetch(url);
          console.log("Response:", response);
          if (!response.ok) {
            setIsError(true)
            return
          }
          const pdbText = await response.text();
          viewerRef.current!.addModel(pdbText, 'pdb')
          viewerRef.current!.setStyle({chain: 'A'}, {cartoon: {color: 'orange'}});
          viewerRef.current!.setStyle({chain: 'B'}, {stick: {color: 'green'}});
          setCurrentModel("Best Complex (Index " + currentJob.best_complex_nr + ")")
        } catch (error) {
          console.error("Error loading conformer in 3DMol viewer:", error)
          setIsError(true)
        }
      } else {
        viewerRef.current!.addModel(currentJob.sdf, 'sdf')
        viewerRef.current!.setStyle({'stick': {'color': 'spectrum'}})
        setCurrentModel("Molecule Editor")
        refreshCurrentJobThumbnail()
      }
      viewerRef.current!.zoomTo()
      viewerRef.current!.render()
    }

    void loadModel()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentJob?.sdf, currentJob?.best_complex_nr])

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

  // init 3DMol viewer on component mount
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
      <div className="absolute top-2 right-2 z-5 flex items-center gap-2">
        <div className="text-sm p-1.5 px-2.5 bg-white rounded-md shadow">
          Current Model: {currentModel}
        </div>
        <Button variant="outline" className="size-8 cursor-pointer border-none shadow" onClick={toggleSpin}>
          {isSpinning ? <Pause /> : <Play />}
        </Button>
      </div>
      {isError &&
          <div className="absolute inset-0 p-8 flex flex-col items-center justify-center z-10 bg-red-50">
            <p className="text-red-700 text-center text-lg font-medium">Error loading 3D model.</p>
            <p className="text-red-700 text-center">Please ensure that the docking job has been completed successfully<br/>and the necessary pose data exists.</p>
          </div>}
      <div ref={containerRef} className="w-full h-full"/>
    </div>
  )
}

export default ThreeDmolFrame