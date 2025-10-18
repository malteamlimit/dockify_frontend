'use client'

import * as React from "react";
import Image from "next/image";

import {AppSidebar} from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import KetcherFrameClient from "@/components/ketcher-frame-client"
import ThreeDmolFrameClient from "@/components/3dmol-frame-client"
import DockingResults from "@/components/results/docking-results";
import {ButtonRunDocking} from "@/components/button-run-docking";


import { useDockingStore } from "@/store/docking-store";
import {CircleAlert} from "lucide-react";


export default function Home() {
  const currentJob = useDockingStore((state) => state.getCurrentJob());
  const showMoleculeSVG = (currentJob?.job_status == "completed" || currentJob?.job_status == "running");

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "380px",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="flex overflow-hidden">
        <header className="bg-background sticky z-10 top-0 flex flex-row shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex flex-row items-center gap-2" ><SidebarTrigger className="-ml-1"/>
            <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Dockify</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block"/>
                <BreadcrumbItem>
                  <BreadcrumbPage>Workspace</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <ButtonRunDocking variant={(currentJob?.runs ?? 0) == 0 ? "new" : "rerun"} disabled={!currentJob || currentJob.job_status == "running" || currentJob?.qed < 0.4 || !currentJob.is_sub} />
        </header>
        { (currentJob?.qed ?? 1) < 0.4 && currentJob !== null ? (<div className="p-4 pb-0">
          <Alert variant="destructive">
            <CircleAlert/>
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              Your QED is below 0.4, which means the molecule is likely not very drug-like. Please optimize it further
              before docking.
            </AlertDescription>
          </Alert>
        </div>) : ""}
        { (!currentJob?.is_sub) ? (<div className="p-4 pb-0">
          <Alert variant="destructive">
            <CircleAlert/>
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              The requiered substructure is not present in the current structure. Please add it to the structure before docking.
            </AlertDescription>
          </Alert>
        </div>) : ""}
        <div className="h-[800px] flex p-4 gap-6">
          <div className="w-1/2 bg-card">
            {showMoleculeSVG ? (
              <Image
                src={`${process.env.NEXT_PUBLIC_API_URL}/static/previews/${currentJob.job_id}.svg`}
                alt="current molecule"
                width="1000"
                height="1000"
                priority
                className={`w-full h-full object-contain border rounded-xl`}
              />
            ) : (
              <KetcherFrameClient />
            )}
          </div>
          <div className="w-1/2 bg-card rounded-xl z-8 overflow-hidden">
            <ThreeDmolFrameClient />
          </div>
        </div>
        <div className="bg-card p-4 overflow-hidden flex-1">
            <DockingResults />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
