'use client'

import * as React from "react";
import Image from "next/image";

import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import KetcherFrameClient from "@/components/ketcher-frame-client"
import ThreeDmolFrameClient from "@/components/3dmol-frame-client"
import DockingResults from "@/components/results/docking-results";


import { useDockingStore } from "@/store/docking-store";
import {CircleAlert} from "lucide-react";


export default function Home() {
  const currentJob = useDockingStore((state) => state.getCurrentJob());
  const showMoleculeSVG = (currentJob?.job_status == "completed" || currentJob?.job_status == "running");

  const [displayedJobId, setDisplayedJobId] = React.useState(currentJob?.job_id);

  React.useEffect(() => {
    if (showMoleculeSVG) {
      setDisplayedJobId(currentJob.job_id);
    }
  }, [currentJob?.job_id, showMoleculeSVG]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "380px",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="h-screen overflow-y-auto">
        <AppHeader />
        <div className="flex flex-col gap-4 my-4">
          {(currentJob?.qed ?? 1) < 0.4 && currentJob !== null ? (<div className="px-4">
            <Alert variant="destructive">
              <CircleAlert/>
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>
                Your QED is below 0.4, which means the molecule is likely not very drug-like. Please optimize it further
                before docking.
              </AlertDescription>
            </Alert>
          </div>) : ""}
          {(!currentJob?.is_sub) ? (<div className="px-4">
            <Alert variant="destructive">
              <CircleAlert/>
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>
                The requiered substructure is not present in the current structure. Please add it to the structure
                before docking.
              </AlertDescription>
            </Alert>
          </div>) : ""}
          <div className="h-[800px] flex px-4 gap-4">
            <div className="w-1/2 relative">

              {/* Ketcher */}
              <div
                  className={`absolute inset-0 transition-opacity duration-300 ${
                      showMoleculeSVG ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
              >
                <Card className="h-full w-full p-0 overflow-hidden">
                  <KetcherFrameClient/>
                </Card>
              </div>

              {/* Image */}
              <div
                  key={displayedJobId}
                  className={`absolute inset-0 transition-opacity duration-300 ${
                      showMoleculeSVG ? 'opacity-100 animate-fadeIn' : 'opacity-0 pointer-events-none'
                  }`}
              >
                <Card className="h-full w-full p-0 bg-ketcher-canvas">
                  <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}/static/previews/${displayedJobId}.svg`}
                      alt="current molecule"
                      width="1000"
                      height="1000"
                      priority
                      className="w-full h-full object-contain"
                  />
                </Card>
              </div>

            </div>
            <div className="w-1/2 rounded-xl z-8">
              <Card className="h-full w-full p-0 bg-ketcher-canvas">
                <div className="h-full w-full rounded-xl overflow-hidden">
                  <ThreeDmolFrameClient/>
                </div>
              </Card>
            </div>
          </div>
          <div className="bg-card px-4 overflow-hidden flex-1">
            <DockingResults/>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
