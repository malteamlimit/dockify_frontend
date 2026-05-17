'use client'

import { useMemo, useState } from 'react';
import { BanIcon, CircleCheckIcon, Loader2Icon, OctagonXIcon } from 'lucide-react';

import { DockingJob } from '@/app/models';
import { useDockingStore } from '@/store/docking-store';
import { deltaGRange, perc2color, validateComplexViolations } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * Toast body for a single job, covering every state. It is always rendered via
 * `toast.custom` with a stable id, so Sonner just swaps the content as the job
 * moves from queued/running to its terminal result -- no dismiss/recreate.
 */
export function JobToast({ job }: { job: DockingJob }) {
  const cancelJob = useDockingStore((s) => s.cancelJob);
  const jobs = useDockingStore((s) => s.jobs);
  const [cancelling, setCancelling] = useState(false);

  const status = job.job_status;
  const active = status === 'queued' || status === 'running';
  const queued = status === 'queued';
  const progress = Math.max(0, Math.min(100, job.progress));

  // ΔG color scale across all jobs -- identical to the sidebar badge so the
  // same result reads the same way in both places.
  const { highest, lowest } = useMemo(() => deltaGRange(jobs), [jobs]);

  const handleCancel = () => {
    setCancelling(true);
    void cancelJob(job.job_id);
  };

  let icon = <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />;
  if (status === 'completed') {
    icon = <CircleCheckIcon className="size-4 shrink-0 text-success" />;
  } else if (status === 'failed') {
    icon = <OctagonXIcon className="size-4 shrink-0 text-destructive" />;
  } else if (status === 'cancelled') {
    icon = <BanIcon className="size-4 shrink-0 text-muted-foreground" />;
  }

  const complexes = job.complexes;
  const best = job.best_complex_nr != null ? complexes[job.best_complex_nr] : null;
  const violationCount = complexes.filter(
    (c) =>
      validateComplexViolations(c, job.delta_g_threshold, job.atom_pair_cst_threshold)
        .length > 0,
  ).length;

  return (
    <div className="flex w-[var(--width)] flex-col gap-2 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <span className="truncate text-sm font-medium">{job.name}</span>
        </div>
        {active && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </Button>
        )}
      </div>

      {active ? (
        <>
          <p className="text-xs text-muted-foreground">
            {cancelling
              ? 'Cancelling — stopping after the current round…'
              : job.progress_info || (queued ? 'Queued…' : 'Running…')}
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${queued ? 0 : progress}%` }}
            />
          </div>
        </>
      ) : status === 'completed' ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {best && job.best_complex_nr != null ? (
            <>
              <Badge color={perc2color(best.delta_g, highest, lowest)}>
                ΔG: <span className="font-mono">{best.delta_g.toFixed(2)}</span>
              </Badge>
              <Badge variant="secondary">Best run #{job.best_complex_nr + 1}</Badge>
            </>
          ) : (
            <Badge variant="destructive">No valid pose</Badge>
          )}
          {complexes.length > 0 && (
            <Badge variant="outline">
              {violationCount}/{complexes.length} violations
            </Badge>
          )}
        </div>
      ) : status === 'failed' ? (
        <p className="text-xs text-destructive">{job.error || 'Docking failed.'}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Docking cancelled.</p>
      )}
    </div>
  );
}