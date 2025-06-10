"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { InterChart } from "@/components/results/inter-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DockingResultsTable } from "@/components/results/docking-results-table";
import { RmsdChart } from "@/components/results/rmsd-chart";
import { useDockingStore } from "@/store/docking-store";
import { timeAgo } from "@/lib/utils";


export function DockingResults() {
  const currentJob = useDockingStore(state => state.getCurrentJob());

  if (currentJob?.weight === null) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Docking Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            This job is a draft. Please run the docking job to see results.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentJob) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Docking Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            No docking results loaded. Use "Load into Workspace" from a result card to view detailed results.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
   <Card className="w-full">
     <CardHeader>
       <div className="flex justify-between items-center">
         <CardTitle>
           Docking Results for Job of
           <Badge variant="outline" className="text-base/[1] font-semibold ml-2 p-2 px-3">
             {timeAgo(Date.parse(currentJob.created))}
           </Badge>
         </CardTitle>
         <div className="flex gap-2 justify-end">
           <Badge className="text-base/[1] font-semibold ml-2 p-2 px-3">
             {currentJob.runs} Run{currentJob.runs === 1 ? '' : 's'}
           </Badge>
         </div>
       </div>
     </CardHeader>
     <CardContent>
       <div className="space-y-4">
         <div>
           <h3 className="text-lg font-medium">Ligand Properties</h3>
           <div className="flex grid grid-cols-4 gap-4 py-2">
             <div className="border rounded-xl p-3">
               <div className="text-sm text-muted-foreground">Weight</div>
               <div className="text-lg font-medium">{currentJob?.weight.toFixed(2)}</div>
             </div>
             <div className="border rounded-xl p-3">
               <div className="text-sm text-muted-foreground">LogP</div>
               <div className="text-lg font-medium">{currentJob?.logp.toFixed(2)}</div>
             </div>
             <div className="border rounded-xl p-3">
               <div className="text-sm text-muted-foreground">QED</div>
               <div className="text-lg font-medium">{currentJob?.qed.toFixed(2)}</div>
             </div>
             <div className="border rounded-xl p-3">
               <div className="text-sm text-muted-foreground">H-Bond Donors/Acceptors</div>
               <div className="text-lg font-medium">
                 {currentJob?.hbond_don}/{currentJob?.hbond_acc}
               </div>
             </div>
           </div>
           <div className="flex flex-col md:flex-row gap-4 mt-2 h-full w-full">
                 <>
                   <div className="flex-3 min-w-0">
                     <RmsdChart chartData={currentJob.complexes}/>
                   </div>
                   <div className="flex-4 min-w-0">
                     <InterChart complexList={currentJob.complexes ?? []}/>
                   </div>
                 </>
           </div>
         </div>

         <h3 className="text-lg font-medium">Docking Complexes</h3>
         <div className="w-full">
           <DockingResultsTable
               complexList={currentJob.complexes ?? []}
               bestComplexId={currentJob.best_complex_nr}
           />
         </div>
       </div>
     </CardContent>
   </Card>
  )
}

export default DockingResults;

