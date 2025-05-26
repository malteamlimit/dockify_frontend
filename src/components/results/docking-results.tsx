"use client";

import * as React from "react";
import {useEffect, useState} from "react";

import {Badge} from "@/components/ui/badge";
import {InterChart} from "@/components/results/inter-chart";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {DockingResultsTable} from "@/components/results/docking-results-table";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"


import {DockingJob} from "@/app/models";
import {getJobById} from "@/lib/api";
import {timeAgo} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {RmsdChart} from "@/components/results/rmsd-chart";



export interface DockingResultsProps {
  jobId?: string;
}

export function DockingResults({ jobId }: DockingResultsProps) {
  const [job, setJob] = useState<DockingJob | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for the 'load-workspace' event from result-preview-card
    const handleLoadWorkspace = (event: CustomEvent) => {
      const { jobId } = event.detail;
      if (jobId) {
        loadJob(jobId);
      }
    };

    window.addEventListener('load-workspace', handleLoadWorkspace as EventListener);

    // If jobId is provided directly as prop, load it
    if (jobId) {
      loadJob(jobId);
    }

    return () => {
      window.removeEventListener('load-workspace', handleLoadWorkspace as EventListener);
    };
  }, [jobId]);

  const loadJob = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getJobById(id);
      setJob(data);
    } catch (error) {
      setError(`Failed to load docking results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Loading Docking Results...</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="animate-pulse">Loading data...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!job) {
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
                      <Badge variant="outline" className="text-base/[1] font-semibold ml-2 p-2 px-3">{timeAgo(Date.parse(job.request.created))}</Badge>
          </CardTitle>
          <div className="flex gap-2 justify-end">
            {/*<Badge className="text-base/[1] font-semibold ml-2 p-2 px-3">{job.request.runs} Run{job.request.runs === 1 ? '' : 's'}</Badge>*/}
            <Input type="number" id="runs" placeholder="Number of Runs" className="p-4.5 w-1/2"/>
            <Button size="lg" className="text-lg h-[2.375rem]">Run Docking</Button>
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
                  <div className="text-lg font-medium">{job.result.ligand_properties?.weight.toFixed(2)}</div>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-sm text-muted-foreground">LogP</div>
                  <div className="text-lg font-medium">{job.result.ligand_properties?.logp.toFixed(2)}</div>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-sm text-muted-foreground">QED</div>
                  <div className="text-lg font-medium">{job.result.ligand_properties?.qed.toFixed(2)}</div>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-sm text-muted-foreground">H-Bond Donors/Acceptors</div>
                  <div
                      className="text-lg font-medium">{job.result.ligand_properties?.hbond_don}/{job.result.ligand_properties?.hbond_acc}</div>
                </div>
              </div>
            <div className="flex flex-col md:flex-row gap-4 mt-2 h-full w-full">
              <div className="flex-3 min-w-0">
                <RmsdChart chartData={job.result.complex_results} />
              </div>
              <div className="flex-4 min-w-0">
                <InterChart complexList={job.result.complex_results} />
              </div>
            </div>
          </div>

          <h3 className="text-lg font-medium">Docking Complexes</h3>
          <div className="w-full">
            <DockingResultsTable complexList={job.result.complex_results} bestComplexId={job.result.best_complex_id} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DockingResults;