'use client'

import { useEffect } from 'react';
import { useDockingStore } from '@/store/docking-store';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { fetchJobs } = useDockingStore();

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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

  return <>{children}</>;
}