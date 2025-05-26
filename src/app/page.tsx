'use client'

import * as React from "react";

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
import KetcherFrameClient from "@/components/ketcher-frame-client"
import ThreeDmolFrameClient from "@/components/3dmol-frame-client"
import DockingResults from "@/components/results/docking-results";
import {ButtonRunDocking} from "@/components/button-run-docking";

import {useMolecule, MoleculeProvider} from "@/context/molecule-context";

function DockingControlWithContext() {
  const { currentSmiles } = useMolecule();
  const { results } = useDockingResults();

  const isExistingMolecule = React.useMemo(() => {
    if (!currentSmiles || !results.length) return false;
    return results.some(result => result.smiles === currentSmiles);
  }, [currentSmiles, results]);

  return <ButtonRunDocking variant={isExistingMolecule ? "rerun" : "new"} />;
}

export default function Home() {
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
          <DockingControlWithContext />
        </header>
        <MoleculeProvider>
          <div className="h-[800px] flex p-4 gap-6">
            <div className="w-1/2 bg-card">
              <KetcherFrameClient />
            </div>
            <div className="w-1/2 bg-card rounded-xl z-8 overflow-hidden">
              <ThreeDmolFrameClient />
            </div>
          </div>
        </MoleculeProvider>
        <div className="bg-card p-4 overflow-hidden flex-1">
            <DockingResults />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
