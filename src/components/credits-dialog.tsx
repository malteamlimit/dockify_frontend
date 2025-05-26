import * as React from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import Image from "next/image";

export function CreditsDialog({ ...props }: React.ComponentProps<typeof Dialog>) {
  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <div className="flex flex-row items-center justify-start gap-4 mb-2">
            <Image
              src={"/logo_unileipzig.svg"}
              alt={"University of Leipzig Logo"}
              width={1000}
              height={1000}
              style={{ height: '75px', width: 'auto' }}
              className="object-contain"
            />
            <Image
              src={"/logo_iwe.png"}
              alt={"IWE Logo"}
              width={1000}
              height={1000}
              style={{ height: '50px', width: 'auto' }}
              className="object-contain"
            />
          </div>
          {/* TODO: optimize credits... */}
          <DialogTitle>Dockify – a PyRosetta Wrapper</DialogTitle>
        </DialogHeader>
        <div className="mt-2 text-xs/5 font-mono" >
            <span className="font-bold">Version:</span> 1.0.0<br />
            <span className="font-bold">Build:</span> #20240601<br />
            <span className="font-bold">OS:</span> {process.env.NEXT_PUBLIC_OS || "unknown"}<br />
            <div className="mt-4 text-sm">
              Dockify is a web-based application for molecular docking, built on top of the PyRosetta framework.<br />It provides an intuitive interface for users to perform docking simulations and analyze results.
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )}