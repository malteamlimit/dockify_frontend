"use client"

import { useEffect, useRef, useState } from "react"
import { useMolecule } from "@/context/molecule-context"
import * as $3Dmol from "3dmol"
import {Button} from "@/components/ui/button";
import {Pause, Play} from "lucide-react";


const ThreeDmolFrame = () => {
  const viewerRef = useRef<$3Dmol.GLViewer | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { moleculeData } = useMolecule()
  const [isSpinning, setIsSpinning] = useState(false)

  useEffect(() => {
    if (containerRef.current && !viewerRef.current) {
      try {
        viewerRef.current = $3Dmol.createViewer(containerRef.current,
          {
            defaultcolors: $3Dmol.elementColors.rasmol,
            backgroundColor: "#eee",
          }
        )
        viewerRef.current.zoomTo()
        viewerRef.current.render()
        viewerRef.current.setStyle({'stick': {'color': 'spectrum'}})
        toggleSpin()
      } catch (error) {
        console.error("Error initializing 3DMol viewer:", error)
      }
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!viewerRef.current || !moleculeData) return

    try {
      viewerRef.current.clear()
      viewerRef.current.addModel(moleculeData)
      viewerRef.current.setStyle({'stick': {'color': 'spectrum'}})
      viewerRef.current.zoomTo()
      viewerRef.current.render()
    } catch (error) {
      console.error("Error loading molecule in 3DMol viewer:", error)
    }
  }, [moleculeData])

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

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
        <div className="text-sm p-1.5 px-2.5 bg-white rounded-md shadow">
          Current Model: from Molecule Editor
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