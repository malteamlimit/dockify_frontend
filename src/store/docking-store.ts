import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';

import { DockingJob } from '@/app/models';
import {
  createJob,
  getAllJobs,
  getProps,
  runDocking as runDockingAPI,
  updateName,
  updateThresholds as updateThresholdsAPI,
  wsGetJobUpdates
} from "@/lib/api";
import { useSettingsStore } from "@/store/settings-store";


interface DockingState {
  // ============ Loading State ============
  isLoading: boolean;

  // ============ Job Management ============
  jobs: DockingJob[];
  fetchJobs: () => Promise<void>;
  createJob: () => Promise<void>;
  createCopy: (job_id: string) => Promise<void>;
  removeJob: (jobId: string) => void;

  // ============ Current Job Selection ============
  currentJobId: string | null;
  getCurrentJob: () => DockingJob | null;
  setCurrentJobId: (job_id: string) => void;

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
  setCurrentStatus: (job_status: "draft" | "running" | "completed" | "failed") => void;
  runPropertiesCalculation: () => Promise<void>;
  runDocking: (name: string, runs: number) => Promise<void>;

  // ============ UI Utilities ============
  refreshCurrentJobThumbnail: () => void;

  // ============ Result Viewing ============
  selectedComplexIndex: number | null;
  setSelectedComplexIndex: (index: number | null) => void;

}

export const useDockingStore = create(immer<DockingState>((set, get) => ({
  isLoading: true,

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

  runDocking: async (name, runs) => set(async (state) => {
    const currentJob = get().getCurrentJob();
    if (!currentJob) return;

    state.setCurrentStatus("running")

    try {
      if (name != currentJob.name) {
        await updateName(currentJob!.job_id, name)
        state.setCurrentName(name)
      }

      if (await runDockingAPI(currentJob!.job_id, runs)) {
        await wsGetJobUpdates(currentJob!.job_id, (data) => {
          set(state => {
            const jobIndex = state.jobs.findIndex(job => job.job_id === data.job_id);
            if (jobIndex >= 0) {
              // Preserve thumbnailRefresh to maintain cache invalidation
              const previousThumbnailRefresh = state.jobs[jobIndex].thumbnailRefresh;
              state.jobs[jobIndex] = data
              if (previousThumbnailRefresh) {
                state.jobs[jobIndex].thumbnailRefresh = previousThumbnailRefresh;
              }
              if (data.error) {
                state.jobs[jobIndex].error = data.error;
              }
            }
          });
        });
      }
    } catch (error) {
      console.error('Error running docking:', error);
    }
  }),

  // ============ Job Management Operations ============
  jobs: [],
  fetchJobs: async () => {
    set({isLoading: true});
    try {
      const jobs = await getAllJobs();
      set({jobs, isLoading: false});

      set((state) => {
        if (state.currentJobId == null) {
          state.currentJobId = jobs[jobs.length - 1].job_id;
          console.log('Set current job id:', state.currentJobId);
        }
      });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      set({isLoading: false});
    }
  },

  createJob: async () => {
    const job = getDefaultJob()
    const jobPublicRaw: string = await createJob(job)
    const jobPublic: DockingJob = JSON.parse(jobPublicRaw);
    set((state) => {
      state.jobs.push(jobPublic);
      state.currentJobId = jobPublic.job_id;
    })
    await get().runPropertiesCalculation();
  },

  createCopy: async (job_id: string) => {
    const job = getCopy(get().jobs.find(job => job.job_id === job_id) || getDefaultJob())
    const jobPublic_raw: string = await createJob(job)
    const jobPublic: DockingJob = JSON.parse(jobPublic_raw);
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
  return {
    // ---- Core Identity ----
    job_id: uuidv4(),
    name: 'Unknown Structure',
    created: new Date().toISOString(),
    job_status: 'draft',

    // ---- Molecular Structure ----
    // TODO: Consider fetching default SMILES from Settings store
    smiles: 'O=CN1CCC2(CNC2)CC1',
    sdf: null,

    // ---- Molecular Properties (initialized as null, calculated later) ----
    weight: 0,
    hbond_acc: 0,
    hbond_don: 0,
    logp: 0,
    qed: 0,
    is_sub: false,

    // ---- Docking Configuration ----
    // TODO: Fetch constraints from Settings store
    constraints: [
      [364, 'HG', [-6.7520, -0.1555, 13.0855], 1.80, 0.125],
      [65, 'OD2', [-7.1638, 5.8368, 16.5862], 3.23, 0.25],
      [65, 'OD2', [-7.5181, 3.1143, 15.5623], 3.25, 0.25],
      [89, 'CB', [-6.0966, 5.3594, 15.7673], 3.70, 0.25],
      [86, 'CD', [-7.1638, 5.8368, 16.5862], 5.11, 0.50]
    ],
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

    // ---- Docking Configuration ----
    // TODO: Fetch constraints from Settings store
    constraints: [
      [364, 'HG', [-6.7520, -0.1555, 13.0855], 1.80, 0.125],
      [65, 'OD2', [-7.1638, 5.8368, 16.5862], 3.23, 0.25],
      [65, 'OD2', [-7.5181, 3.1143, 15.5623], 3.25, 0.25],
      [89, 'CB', [-6.0966, 5.3594, 15.7673], 3.70, 0.25],
      [86, 'CD', [-7.1638, 5.8368, 16.5862], 5.11, 0.50]
    ],
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
