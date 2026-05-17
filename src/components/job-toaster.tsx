'use client'

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { DockingJob } from '@/app/models';
import { useDockingStore } from '@/store/docking-store';
import { getAck, setAck, jobSignature, pruneAcks } from '@/lib/job-ack';
import { JobToast } from './job-toast';

const CONNECTION_TOAST_ID = 'job-stream-connection';

type JobStatus = DockingJob['job_status'];

const isActive = (s: JobStatus) => s === 'queued' || s === 'running';
const isTerminal = (s: JobStatus) =>
  s === 'completed' || s === 'failed' || s === 'cancelled';

function toastDuration(status: JobStatus, missed: boolean): number {
  if (isActive(status)) return Infinity;
  if (status === 'completed') return 6000;
  if (status === 'cancelled') return 8000;
  // failed: a live failure stays until dismissed; a missed one auto-clears.
  return missed ? 10000 : Infinity;
}

/**
 * Show (or update) the single custom toast for a job. Because every state uses
 * the same custom toast and id, Sonner just swaps the content on each update --
 * no fragile dismiss/recreate when a job reaches its result.
 */
function showJobToast(job: DockingJob, missed: boolean) {
  toast.custom(() => <JobToast job={job} />, {
    id: job.job_id,
    duration: toastDuration(job.job_status, missed),
  });
  if (isTerminal(job.job_status)) {
    setAck(job.job_id, jobSignature(job.job_status, job.runs));
  }
}

/**
 * Drives Sonner toasts from the job store. A toast appears for every job that
 * becomes active during this session and follows it through to its terminal
 * state. On the first load it also shows a one-time toast for any job that
 * reached a terminal state while the page was closed.
 */
export function JobToaster() {
  const jobs = useDockingStore((s) => s.jobs);
  const streamStatus = useDockingStore((s) => s.streamStatus);

  // job_ids seen active during this session (so their result gets a toast).
  const trackedRef = useRef<Set<string>>(new Set());
  // The missed-result scan must run exactly once, after the initial load.
  const initialScanDoneRef = useRef(false);

  useEffect(() => {
    // One-time scan: jobs already terminal on load whose outcome the user has
    // not been notified about yet (finished while away).
    if (!initialScanDoneRef.current && jobs.length > 0) {
      initialScanDoneRef.current = true;
      for (const job of jobs) {
        if (isTerminal(job.job_status)) {
          const signature = jobSignature(job.job_status, job.runs);
          if (getAck(job.job_id) !== signature) {
            showJobToast(job, true);
          }
        }
      }
      pruneAcks(jobs.map((j) => j.job_id));
    }

    const present = new Set<string>();
    for (const job of jobs) {
      present.add(job.job_id);

      if (isActive(job.job_status)) {
        trackedRef.current.add(job.job_id);
        showJobToast(job, false);
      } else if (isTerminal(job.job_status) && trackedRef.current.has(job.job_id)) {
        // Transitioned active -> terminal during this session.
        trackedRef.current.delete(job.job_id);
        showJobToast(job, false);
      }
    }

    // Drop toasts for jobs that vanished (deleted, possibly from another tab).
    for (const jobId of trackedRef.current) {
      if (!present.has(jobId)) {
        trackedRef.current.delete(jobId);
        toast.dismiss(jobId);
      }
    }
  }, [jobs]);

  useEffect(() => {
    if (streamStatus === 'reconnecting') {
      toast.loading('Connection lost — reconnecting…', {
        id: CONNECTION_TOAST_ID,
        duration: Infinity,
      });
    } else {
      toast.dismiss(CONNECTION_TOAST_ID);
    }
  }, [streamStatus]);

  return null;
}