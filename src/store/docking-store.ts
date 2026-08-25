import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';

import { DockingJob } from '@/app/models';
import {
  cancelDocking,
  createJob,
  getAllJobs,
  getProps,
  runDocking as runDockingAPI,
  updateName,
  updateThresholds as updateThresholdsAPI,
} from "@/lib/api";
import { startJobStream, stopJobStream, StreamStatus } from "@/lib/job-stream";
import { useSettingsStore } from "@/store/settings-store";
import { useTargetStore } from "@/store/target-store";


interface DockingState {
  // ============ Loading State ============
  isLoading: boolean;
  isCreatingJob: boolean;

  // ============ Job Management ============
  jobs: DockingJob[];
  fetchJobs: () => Promise<void>;
  createJob: () => Promise<void>;
  ensureDraftJob: () => Promise<void>;
  createCopy: (job_id: string) => Promise<void>;
  removeJob: (jobId: string) => void;
  upsertJob: (job: DockingJob) => void;

  // ============ Job Stream ============
  streamStatus: StreamStatus;
  connectStream: () => void;
  disconnectStream: () => void;

  // ============ Current Job Selection ============
  currentJobId: string | null;
  getCurrentJob: () => DockingJob | null;
  setCurrentJobId: (job_id: string | null) => void;

  // ============ Job Structure & Properties ============
  setCurrentSmiles: (smiles: string) => void;
  setCurrentSdf: (object: {sdf: string} | null) => void;
  updateStructure: (smiles: string, sdf: string) => void;
  setCurrentProps: (props: {
    weight: number;
    hbond_acc: number;
    hbond_don: number;
    logp: number;
    qed: number;
    is_sub: boolean;
  }) => void;
  setCurrentName: (name: string) => void;

  // ============ Violation Thresholds ============
  updateThresholds: (jobId: string, deltaGThreshold: number, atomPairCstThreshold: number) => Promise<void>;

  // ============ Job Status & Execution ============
  setCurrentStatus: (job_status: DockingJob["job_status"]) => void;
  runPropertiesCalculation: () => Promise<void>;
  runDocking: (name: string, runs: number) => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;

  // ============ UI Utilities ============
  refreshCurrentJobThumbnail: () => void;

  // ============ Result Viewing ============
  selectedComplexIndex: number | null;
  setSelectedComplexIndex: (index: number | null) => void;

}

export const useDockingStore = create(immer<DockingState>((set, get) => ({
  isLoading: true,
  isCreatingJob: false,

  // ============ Current Job Selection ============
  currentJobId: null,
  getCurrentJob: () => {
    const state = get();
    return state.currentJobId
        ? state.jobs.find(job => job.job_id === state.currentJobId) || null
        : null;
  },
  setCurrentJobId: (job_id) => set({currentJobId: job_id, selectedComplexIndex: null}),

  // ============ Job Structure & Properties Updates ============
  setCurrentSmiles: (smiles) => set((state) => {
    const jobIndex = state.jobs.findIndex(job => job.job_id === state.currentJobId);
    if (jobIndex >= 0) {
      state.jobs[jobIndex].smiles = smiles;
    }
  }),
  setCurrentSdf: (object) => set((state) => {
    const jobIndex = state.jobs.findIndex(job => job.job_id === state.currentJobId);
    if (jobIndex >= 0) {
      state.jobs[jobIndex].sdf = object?.sdf ?? null;
    }
  }),
  updateStructure: (smiles: string, sdf: string) => {
    set((state) => {
      const job = state.jobs.find(j => j.job_id === state.currentJobId);
      if (job) {
        job.smiles = smiles;
        job.sdf = sdf;
      }
    });
    get().runPropertiesCalculation().catch(console.error);
  },
  setCurrentName: (name) => set((state) => {
    const jobIndex = state.jobs.findIndex(job => job.job_id === state.currentJobId);
    if (jobIndex >= 0) {
      state.jobs[jobIndex].name = name;
    }
  }),

  // ============ Violation Thresholds ============
  updateThresholds: async (jobId, deltaGThreshold, atomPairCstThreshold) => {
    const updated = await updateThresholdsAPI(jobId, deltaGThreshold, atomPairCstThreshold);
    set((state) => {
      const jobIndex = state.jobs.findIndex(job => job.job_id === jobId);
      if (jobIndex >= 0) {
        // Preserve thumbnailRefresh to keep cache invalidation intact
        const previousThumbnailRefresh = state.jobs[jobIndex].thumbnailRefresh;
        state.jobs[jobIndex] = updated;
        if (previousThumbnailRefresh) {
          state.jobs[jobIndex].thumbnailRefresh = previousThumbnailRefresh;
        }
      }
    });
  },

  // ============ Job Status Management ============
  setCurrentStatus: (job_status) => set((state) => {
    const jobIndex = state.jobs.findIndex(job => job.job_id === state.currentJobId);
    if (jobIndex >= 0) {
      state.jobs[jobIndex].job_status = job_status;
    }
  }),

  // ============ Molecular Properties ============
  setCurrentProps: (props) => set((state) => {
    const jobIndex = state.jobs.findIndex(job => job.job_id === state.currentJobId);
    if (jobIndex >= 0) {
      state.jobs[jobIndex].weight = props.weight;
      state.jobs[jobIndex].hbond_acc = props.hbond_acc;
      state.jobs[jobIndex].hbond_don = props.hbond_don;
      state.jobs[jobIndex].logp = props.logp;
      state.jobs[jobIndex].qed = props.qed;
      state.jobs[jobIndex].is_sub = props.is_sub;
    }
  }),

  // ============ Asynchronous Operations ============
  runPropertiesCalculation: async () => {
    const currentJob = get().getCurrentJob();
    if (!currentJob) return;

    try {
      const props = await getProps(currentJob.smiles, currentJob.job_id);
      set((state) => {
        const jobIndex = state.jobs.findIndex(job => job.job_id === state.currentJobId);
        if (jobIndex >= 0) {
          state.jobs[jobIndex].weight = props.weight;
          state.jobs[jobIndex].hbond_acc = props.hbond_acc;
          state.jobs[jobIndex].hbond_don = props.hbond_don;
          state.jobs[jobIndex].logp = props.logp;
          state.jobs[jobIndex].qed = props.qed;
          state.jobs[jobIndex].is_sub = props.is_sub;
        }
      });
    } catch (e) {
      console.error('Error running properties calculation', e);
    }
  },

  runDocking: async (name, runs) => {
    const currentJob = get().getCurrentJob();
    if (!currentJob) return;

    const previousStatus = currentJob.job_status;
    try {
      if (name != currentJob.name) {
        await updateName(currentJob.job_id, name);
        get().setCurrentName(name);
      }
      get().setCurrentStatus("queued");
      await runDockingAPI(currentJob.job_id, runs);
    } catch (error) {
      console.error('Error running docking:', error);
      get().setCurrentStatus(previousStatus);
    }
  },

  cancelJob: async (jobId) => {
    try {
      await cancelDocking(jobId);
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  },

  // ============ Job Management Operations ============
  jobs: [],
  fetchJobs: async () => {
    set({isLoading: true});
    try {
      const jobs = await getAllJobs();
      set({jobs, isLoading: false});

      set((state) => {
        if (state.currentJobId == null && jobs.length > 0) {
          state.currentJobId = jobs[jobs.length - 1].job_id;
        }
      });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      set({isLoading: false});
    }
  },

  createJob: async () => {
    if (get().isCreatingJob) return;
    set({isCreatingJob: true});
    try {
      const job = getDefaultJob()
      const jobPublic = await createJob(job)
      set((state) => {
        state.jobs.push(jobPublic);
        state.currentJobId = jobPublic.job_id;
      })
      await get().runPropertiesCalculation();
    } finally {
      set({isCreatingJob: false});
    }
  },

  ensureDraftJob: async () => {
    const state = get();
    if (state.isLoading || state.isCreatingJob || state.jobs.length > 0) return;
    if (!useTargetStore.getState().activeTarget) return;
    await state.createJob().catch((e) => console.error('Error creating initial draft job:', e));
  },

  createCopy: async (job_id: string) => {
    const job = getCopy(get().jobs.find(job => job.job_id === job_id) || getDefaultJob())
    const jobPublic = await createJob(job)
    set((state) => {
      state.jobs.push(jobPublic);
      state.currentJobId = jobPublic.job_id;
    })
    await get().runPropertiesCalculation();
  },

  removeJob: (jobId) => set((state) => {
    state.jobs = state.jobs.filter(job => job.job_id !== jobId);
    if (state.currentJobId === jobId) {
      state.currentJobId = null;
    }
  }),

  // Insert a job, or replace it in place if already present. Used by the job
  // stream to apply pushed updates (and newly created jobs from other clients).
  upsertJob: (job) => set((state) => {
    const jobIndex = state.jobs.findIndex(j => j.job_id === job.job_id);
    if (jobIndex >= 0) {
      // Preserve thumbnailRefresh to keep cache invalidation intact.
      const previousThumbnailRefresh = state.jobs[jobIndex].thumbnailRefresh;
      state.jobs[jobIndex] = job;
      if (previousThumbnailRefresh) {
        state.jobs[jobIndex].thumbnailRefresh = previousThumbnailRefresh;
      }
    } else {
      state.jobs.push(job);
    }
  }),

  // ============ Job Stream ============
  streamStatus: 'closed',
  connectStream: () => {
    startJobStream({
      onJob: (job) => get().upsertJob(job),
      onDeleted: (jobId) => get().removeJob(jobId),
      onStatusChange: (status) => set({ streamStatus: status }),
    });
  },
  disconnectStream: () => {
    stopJobStream();
  },

  // ============ UI Utilities ============
  refreshCurrentJobThumbnail: () => set((state) => {
    const jobIndex = state.jobs.findIndex(job => job.job_id === state.currentJobId);
    if (jobIndex >= 0) {
      state.jobs[jobIndex].thumbnailRefresh = Date.now();
    }
  }),

  // ============ Result Viewing ============
  selectedComplexIndex: null,
  setSelectedComplexIndex: (index) => set({selectedComplexIndex: index}),
})))



// ============ Default Job Factory ============
/**
 * Creates a new default docking job with initial values
 * All molecular properties are set to null initially and calculated via runPropertiesCalculation
 */
export function getDefaultJob(): DockingJob {
  const target = useTargetStore.getState().activeTarget;
  if (!target) throw new Error("No docking target selected.");

  return {
    // ---- Core Identity ----
    job_id: uuidv4(),
    name: 'Unnamed Structure',
    created: new Date().toISOString(),
    job_status: 'draft',

    // ---- Molecular Structure (seeded from active target) ----
    smiles: target.core_smiles,
    sdf: null,

    // ---- Molecular Properties (initialized as null, calculated later) ----
    weight: 0,
    hbond_acc: 0,
    hbond_don: 0,
    logp: 0,
    qed: 0,
    is_sub: false,

    // ---- Docking Configuration (seeded from active target) ----
    constraints: target.constraints,
    runs: 0,

    // ---- Violation Thresholds (seeded from the global default settings) ----
    delta_g_threshold: useSettingsStore.getState().deltaGThreshold,
    atom_pair_cst_threshold: useSettingsStore.getState().atomPairCstThreshold,

    // ---- Docking Results ----
    best_complex_nr: null,
    complexes: [],

    // ---- Status & Error Handling ----
    error: null,
    progress: 0,
    progress_info: '',
  };
}


// ============ Job Copy Factory ============
/**
 * Creates a copy of an existing docking job with a new ID
 * Preserves the SMILES structure but resets docking results and running state
 */
export function getCopy(jobOld: DockingJob): DockingJob {
  return {
    // ---- Core Identity (new ID and timestamp) ----
    job_id: uuidv4(),
    name: jobOld.name,
    created: new Date().toISOString(),
    job_status: 'draft',

    // ---- Molecular Structure (copy from original) ----
    smiles: jobOld.smiles,
    sdf: null,

    // ---- Molecular Properties (copy from original) ----
    weight: jobOld.weight,
    hbond_acc: jobOld.hbond_acc,
    hbond_don: jobOld.hbond_don,
    logp: jobOld.logp,
    qed: jobOld.qed,
    is_sub: jobOld.is_sub,

    // ---- Docking Configuration (inherited from original job) ----
    constraints: jobOld.constraints,
    runs: 0,

    // ---- Violation Thresholds (copied from the original job) ----
    delta_g_threshold: jobOld.delta_g_threshold,
    atom_pair_cst_threshold: jobOld.atom_pair_cst_threshold,

    // ---- Docking Results (reset for new docking) ----
    best_complex_nr: null,
    complexes: [],

    // ---- Status & Error Handling ----
    error: null,
    progress: 0,
    progress_info: '',
  };
}
