'use client'

import * as React from "react";
import Image from "next/image";

import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import KetcherFrameClient from "@/components/ketcher-frame-client"
import ThreeDmolFrameClient from "@/components/3dmol-frame-client"
import DockingResults from "@/components/results/docking-results";
import { LigandPropertiesBar } from "@/components/ligand-properties-bar";
import { NoStructurePlaceholder } from "@/components/no-structure-placeholder";

import { useDockingStore } from "@/store/docking-store";
import {Copy} from "lucide-react";
import {toast} from "sonner";

export default function Home() {
  const currentJob = useDockingStore((state) => state.getCurrentJob());
  const createCopy = useDockingStore((state) => state.createCopy);
  const showMoleculeSVG = !!currentJob && currentJob.job_status !== "draft";
  const showPlaceholder = !currentJob;

  const [displayedJobId, setDisplayedJobId] = React.useState(currentJob?.job_id);

  React.useEffect(() => {
    if (showMoleculeSVG) {
      setDisplayedJobId(currentJob.job_id);
    }
  }, [currentJob?.job_id, showMoleculeSVG]);

  const handleCopy = (jobId: string) => {
    createCopy(jobId).catch(() => toast.error("There was an error. Please try again later. :("))
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "380px",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="h-screen overflow-y-auto gap-2">
        <AppHeader />
        <LigandPropertiesBar />
        <div className="flex flex-col gap-4">
          <div className="h-[800px] flex px-4 gap-4 relative">
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
              {displayedJobId !== undefined && <div
                  key={displayedJobId}
                  className={`absolute inset-0 transition-opacity duration-300 ${
                      showMoleculeSVG ? 'opacity-100 animate-fadeIn' : 'opacity-0 pointer-events-none'
                  }`}
              >
                <Card className="h-full w-full p-0 bg-ketcher-canvas relative overflow-hidden">
                  <div className="absolute top-2 right-2 z-5 flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="h-8 cursor-pointer border-none shadow"
                      onClick={() => handleCopy(displayedJobId)}
                    >
                      <Copy /> Copy into new design
                    </Button>
                  </div>
                  <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}/static/previews/${displayedJobId}.svg?v=0`}
                      alt="current molecule"
                      width="1000"
                      height="1000"
                      priority
                      className="w-full h-full object-contain"
                  />
                </Card>
              </div>}

            </div>
            <div className="w-1/2 rounded-xl z-8">
              <Card className="h-full w-full p-0 bg-ketcher-canvas">
                <div className="h-full w-full rounded-xl overflow-hidden">
                  <ThreeDmolFrameClient/>
                </div>
              </Card>
            </div>

            {/* Placeholder */}
            <div
                className={`absolute inset-0 mx-4 z-9 transition-opacity duration-300 ${
                    showPlaceholder ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            >
              <NoStructurePlaceholder/>
            </div>
          </div>
          {currentJob && <div className="bg-card px-4 pb-4 overflow-hidden flex-1">
            <DockingResults/>
          </div>}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
