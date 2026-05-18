'use client'

import { useEffect } from 'react';
import { useDockingStore } from '@/store/docking-store';
import { useTargetStore } from '@/store/target-store';
import { JobToaster } from '@/components/job-toaster';
import { TargetSelectionDialog } from '@/components/target-selection-dialog';
import { getActiveTarget, type TargetInfo } from '@/lib/api';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { fetchJobs, connectStream, disconnectStream } = useDockingStore();
  const needsTargetSelection = useTargetStore((state) => state.needsTargetSelection);
  const { setActiveTarget } = useTargetStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchJobs();
      if (!cancelled) connectStream();

      // Check whether a target has already been selected.
      // 404 means no target → show the selection dialog.
      try {
        const target = await getActiveTarget();
        if (!cancelled) setActiveTarget(target);
      } catch {
        if (!cancelled) useTargetStore.getState().clearActiveTarget();
      }
    })();
    return () => {
      cancelled = true;
      disconnectStream();
    };
  }, [fetchJobs, connectStream, disconnectStream, setActiveTarget]);

  const handleTargetSelected = (target: TargetInfo) => {
    setActiveTarget(target);
  };

  // fix: ketcher state update error muting in dev mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error

      console.error = (...args) => {
        const message = String(args[0] || '')

        const isKetcherWarning =
          message.includes('Cannot update a component') ||
          (message.includes("can't access property") &&
           message.includes('ketcher'))

        if (isKetcherWarning) {
          return
        }

        originalError.apply(console, args)
      }

      return () => {
        console.error = originalError
      }
    }
  }, [])

  return (
    <>
      {children}
      <JobToaster />
      <TargetSelectionDialog
        open={needsTargetSelection}
        onSelect={handleTargetSelected}
      />
    </>
  );
}