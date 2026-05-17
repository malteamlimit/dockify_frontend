"use client";

import * as React from "react";

import { useDockingStore } from "@/store/docking-store";
import { validateComplexViolations } from "@/lib/utils";

import { HistoChart } from "@/components/results/histo-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DockingResultsTable } from "@/components/results/docking-results-table";
import { RmsdChart } from "@/components/results/rmsd-chart";

export function DockingResults() {
  const currentJob = useDockingStore(state => state.getCurrentJob());

  // State for highlighting complexes when hovering over histogram bins
  const [highlightedComplexIndices, setHighlightedComplexIndices] = React.useState<number[]>([]);

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

  // filter complexes that have no violations for the job's thresholds
  const validComplexes = currentJob.complexes?.filter(complex =>
    validateComplexViolations(complex, currentJob.delta_g_threshold, currentJob.atom_pair_cst_threshold).length === 0
  ) ?? [];

  return (
    <Card className="w-full mb-4">
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 h-full w-full">
                <>
                  <div className="flex-1 min-w-0">
                    <RmsdChart chartData={validComplexes}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <HistoChart complexList={validComplexes} complexListFull={currentJob?.complexes} onHoverBinChangeAction={setHighlightedComplexIndices}/>
                  </div>
                </>
          </div>

          <h3 className="text-lg font-medium">Docking Complexes</h3>
          <div className="w-full">
            <DockingResultsTable job={currentJob} highlightedComplexIndices={highlightedComplexIndices} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DockingResults;
