import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';

import { DockingJob } from '@/app/models';
import {
  createJob,
  generateConf,
  getAllJobs,
  getProps,
  runDocking as runDockingAPI,
  updateName,
  wsGetJobUpdates
} from "@/lib/api";


interface DockingState {
  isLoading: boolean;
  fetchJobs: () => Promise<void>;
  createJob: () => Promise<void>;
  createCopy: (job_id: string) => Promise<void>;

  currentJobId: string | null;
  getCurrentJob: () => DockingJob | null;
  setCurrentJobId: (job_id: string) => void;
  setCurrentSmiles: (smiles: string) => void;
  setCurrentSdf: (object: {sdf: string} | null) => void;
  setCurrentStatus: (job_status: "draft" | "running" | "completed" | "failed") => void;
  setCurrentProps: (props: {
    weight: number;
    hbond_acc: number;
    hbond_don: number;
    logp: number;
    qed: number;
    is_sub: boolean;
  }) => void;
  setCurrentName: (name: string) => void;
  runPropertiesCalculation: () => Promise<void>;
  runDocking: (name: string, runs: number) => Promise<void>;

  jobs: DockingJob[];
  removeJob: (jobId: string) => void;

}

export const useDockingStore = create(immer<DockingState>((set, get) => ({
  isLoading: true,

  currentJobId: null,
  getCurrentJob: () => {
    const state = get();
    return state.currentJobId
        ? state.jobs.find(job => job.job_id === state.currentJobId) || null
        : null;
  },
  setCurrentJobId: (job_id) => set({currentJobId: job_id}),
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
  setCurrentName: (name) => set((state) => {
    const jobIndex = state.jobs.findIndex(job => job.job_id === state.currentJobId);
    if (jobIndex >= 0) {
      state.jobs[jobIndex].name = name;
    }
  }),
  setCurrentStatus: (job_status) => set((state) => {
    const jobIndex = state.jobs.findIndex(job => job.job_id === state.currentJobId);
    if (jobIndex >= 0) {
      state.jobs[jobIndex].job_status = job_status;
    }
  }),
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
  runPropertiesCalculation: async () => set(async (state) => {
    const currentJob = state.getCurrentJob();
    if (!currentJob) return;

    try {

      const props = await getProps(currentJob.smiles, currentJob.job_id);

      state.setCurrentProps(props);

    } catch (e) {
      console.error('Error running properties calculation', e);
    }


  }),
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
        console.log('Docking started NOOOOOOOWWW AWAITING THE OPENING OF THE WEBSOCKET');
        await wsGetJobUpdates(currentJob!.job_id, (data) => {
          set(state => {
            const jobIndex = state.jobs.findIndex(job => job.job_id === data.job_id);
            if (jobIndex >= 0) {
              state.jobs[jobIndex] = data
              if (data.error) {
                state.jobs[jobIndex].error = data.error;
              }
            }
          });
        });
      }
    } catch (error) {
      console.error('Error running docking:', error);
      // state.setCurrentStatus("failed")
    }
  }),

  jobs: [],
  removeJob: (jobId) => set((state) => {
    state.jobs = state.jobs.filter(job => job.job_id !== jobId);
    if (state.currentJobId === jobId) {
      state.currentJobId = null;
    }
  }),

  fetchJobs: async () => {
    set({isLoading: true});
    try {
      const jobs = await getAllJobs();

      set({jobs, isLoading: false});

      set((state) => {
        if (jobs.length === 0) {
          state.createJob()
        } else if (state.currentJobId == null) {
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
  },
  createCopy: async (job_id: string) => {
    const job = getCopy(get().jobs.find(job => job.job_id === job_id) || getDefaultJob())
    const jobPublic_raw: string = await createJob(job)
    const jobPublic: DockingJob = JSON.parse(jobPublic_raw);
    set((state) => {
      state.jobs.push(jobPublic);
      state.currentJobId = jobPublic.job_id;
    })
  }
})))



export function getDefaultJob(): DockingJob {
  const job = {
    job_id: uuidv4(),
    name: 'Unknown Structure',
    created: new Date().toISOString(),
    // TODO: Fetch from Settings
    constraints: [[364, 'HG', [-6.7520, -0.1555, 13.0855], 1.80, 0.125], [65, 'OD2', [-7.1638, 5.8368, 16.5862], 3.23, 0.25], [65, 'OD2', [-7.5181, 3.1143, 15.5623], 3.25, 0.25], [89, 'CB', [-6.0966, 5.3594, 15.7673], 3.70, 0.25], [86, 'CD', [-7.1638, 5.8368, 16.5862], 5.11, 0.50]],
    job_status: 'draft',
    runs: 0,
    // TODO: Fetch from Settings
    // smiles: 'CN(C(=O)CN3CC2(CCN(C(=O)c1cccnc1)CC2)C3)c5ccc4COCc4c5',
    smiles: 'O=[C]N1CCC2(CC1)C[N]C2',
    sdf: '',
    error: null,
    progress: 0,
    progress_info: '',
    complexes: [],
  }
  return job
}


export function getCopy(job_old: DockingJob): DockingJob {
  const job = {
    job_id: uuidv4(),
    name: job_old.name,
    created: new Date().toISOString(),
    // TODO: Fetch from Settings
    constraints: [[364, 'HG', [-6.7520, -0.1555, 13.0855], 1.80, 0.125], [65, 'OD2', [-7.1638, 5.8368, 16.5862], 3.23, 0.25], [65, 'OD2', [-7.5181, 3.1143, 15.5623], 3.25, 0.25], [89, 'CB', [-6.0966, 5.3594, 15.7673], 3.70, 0.25], [86, 'CD', [-7.1638, 5.8368, 16.5862], 5.11, 0.50]],
    job_status: 'draft',
    runs: 0,
    // TODO: Fetch from Settings
    // smiles: 'CN(C(=O)CN3CC2(CCN(C(=O)c1cccnc1)CC2)C3)c5ccc4COCc4c5',
    smiles: job_old.smiles,
    sdf: '',
    error: null,
    progress: 0,
    progress_info: '',
    complexes: [],
  }
  return job
}