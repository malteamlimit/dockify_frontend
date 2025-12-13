import {DockingJob} from "@/app/models";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getAllJobs() {
  const res = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'GET',
  });
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json(); // list[DockingJobPreview]
}


export async function createJob(job: DockingJob) {
    const res = await fetch(`${API_BASE_URL}/jobs/create`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(job)
    });
    if (!res.ok) throw new Error('Failed to create job');
    return res.json(); // job_id
}

export async function updateName(jobId: string, new_name: string) {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/name?new_name=${new_name}`, {
        method: 'PATCH',
    });
    if (!res.ok) throw new Error(`Failed to update name for job ${jobId}`);
    return res.json();
}


export async function deleteJobById(jobId: string) {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete job ${jobId}`);
    return res.json();
}


export async function runDocking(jobId: string, runs: number, ) {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/run?runs=${runs}`, {
        method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to run docking for job ${jobId}`);
    return res.json();
}


export async function wsGetJobUpdates(jobId: string, onMessage: (data: any) => void) {
    const ws = new WebSocket(`${API_BASE_URL.replace(/^http/, 'ws')}/jobs/${jobId}/status`);

    ws.onopen = () => {
        console.log(`WebSocket connection established for job ${jobId}`);
    };

    ws.onmessage = (event) => {
        const data: DockingJob = JSON.parse(event.data);
        console.log(`WebSocket message received for job ${jobId}:`, data);
        onMessage(data);
    };

    ws.onerror = (error) => {
        console.error(`WebSocket error for job ${jobId}:`, error);
    };

    ws.onclose = () => {
        console.log(`WebSocket connection closed for job ${jobId}`);
    };

    return ws;
}




export async function generateConf(smiles: string, job_id: string) {
  const res = await fetch(`${API_BASE_URL}/util/genConf`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ smiles: smiles, job_id: job_id })
  });
  if (!res.ok) throw new Error(`Failed to generate Conformer for SMILES: ${smiles}`);
  const data = await res.json();
  return data.sdf; // sdf
}


export async function getProps(smiles: string, job_id: string) {
    const res = await fetch(`${API_BASE_URL}/util/props`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ smiles: smiles, job_id: job_id })
    });
    if (!res.ok) throw new Error(`Failed to get Con former for SMILES: ${smiles}`);
    return res.json(); // message
}



// ---------------------- DB Transfer ----------------------

export async function exportDatabase() {
    const res = await fetch(`${API_BASE_URL}/database/export`, {
        method: 'GET',
    });
    if (!res.ok) {
        throw new Error((await res.json()).detail || 'Failed to export database')
    }
    return res.blob();
}

export async function importDatabase(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/database/import`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) {
        throw new Error((await res.json()).detail || 'Failed to import database')
    }
    return res.json();
}

export async function resetDatabase() {
    const res = await fetch(`${API_BASE_URL}/database/reset`, {
        method: 'POST',
    });
    if (!res.ok) {
        throw new Error((await res.json()).detail || 'Failed to reset database')
    }
    return res.json();
}