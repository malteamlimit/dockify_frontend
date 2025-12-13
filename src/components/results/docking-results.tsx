"use client";

import * as React from "react";

import { useDockingStore } from "@/store/docking-store";
import { useSettingsStore } from "@/store/settings-store";
import { timeAgo } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { InterChart } from "@/components/results/inter-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DockingResultsTable } from "@/components/results/docking-results-table";
import { RmsdChart } from "@/components/results/rmsd-chart";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { OctagonAlert } from "lucide-react";


export function DockingResults() {
  const currentJob = useDockingStore(state => state.getCurrentJob());
  const qedThreshold = useSettingsStore((state) => state.qedThreshold);

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
            No docking results loaded. Use &#34;Load into Workspace&#34; from a result card to view detailed results.
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
            <div className="flex grow justify-between align-middle gap-4 py-2">
              <div className="flex-1/5 grow border rounded-xl p-3">
                <div className="text-sm text-muted-foreground">Weight</div>
                <div className="text-lg font-mono font-medium">{currentJob?.weight.toFixed(2)}</div>
              </div>
              <div className="flex-1/5 grow border rounded-xl p-3">
                <div className="text-sm text-muted-foreground">LogP</div>
                <div className="text-lg font-mono font-medium">{currentJob?.logp.toFixed(2)}</div>
              </div>
              <div className={`flex-1/5 grow border rounded-xl p-3 ${currentJob?.qed < qedThreshold && ''}`} >
                <div className="text-sm text-muted-foreground">QED</div>
                <div className='flex gap-2'>
                  <div className="text-lg font-mono font-medium">{currentJob?.qed.toFixed(2)}</div>
                  <div className={`transition-opacity ease-in duration-400 ${currentJob?.qed < qedThreshold ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center justify-center text-sm/0 bg-warning-bg border-warning-border border-1 rounded-md">
                          <p className="pl-2 text-warning-text whitespace-nowrap">QED is low</p>
                          <div
                              className="flex items-center justify-center text-warning-text text-xs font-medium w-6 h-6 rounded-full flex-shrink-0">
                            <OctagonAlert size={14}/>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm flex flex-col items-center align-middle gap-1">
                          <p className="text-warning-border text-center">The QED score is below the threshold
                            of {qedThreshold}.<br/>Improve your structure or change the threshold.</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
              <div className="flex-2/5 flex flex-row grow border rounded-xl">
                <div className="flex-1 p-3">
                  <div className="text-sm text-muted-foreground">H-Bond Donor</div>
                  <div className="text-lg font-mono font-medium">{currentJob?.hbond_don}</div>
                </div>
                <Separator orientation={'vertical'} />
                <div className="flex-1 p-3">
                  <div className="text-sm text-muted-foreground">H-Bond Acceptor</div>
                  <div className="text-lg font-mono font-medium">{currentJob?.hbond_don}</div>
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
            <DockingResultsTable job={currentJob} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DockingResults;
