'use client'

import { useEffect } from 'react';
import { useDockingStore } from '@/store/docking-store';
import { JobToaster } from '@/components/job-toaster';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { fetchJobs, connectStream, disconnectStream } = useDockingStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchJobs();
      // connect only after the initial REST load: fetchJobs replaces the whole
      // jobs array, which would otherwise drop jobs already pushed by the stream.
      if (!cancelled) connectStream();
    })();
    return () => {
      cancelled = true;
      disconnectStream();
    };
  }, [fetchJobs, connectStream, disconnectStream]);

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
    </>
  );
}