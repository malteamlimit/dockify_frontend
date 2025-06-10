'use client'

import { useEffect } from 'react';
import { useDockingStore } from '@/store/docking-store';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { fetchJobs } = useDockingStore();

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return <>{children}</>;
}