import {DockingJob} from "@/app/models";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getAllJobs() {
  const res = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'GET',
  });
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json(); // list[DockingJobPreview]
}


export async function createJob(job: DockingJob): Promise<DockingJob> {
    const res = await fetch(`${API_BASE_URL}/jobs/create`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(job)
    });
    if (!res.ok) throw new Error('Failed to create job');
    return res.json(); // the created DockingJob (with an empty complexes array)
}

export async function updateName(jobId: string, new_name: string) {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/name?new_name=${new_name}`, {
        method: 'PATCH',
    });
    if (!res.ok) throw new Error(`Failed to update name for job ${jobId}`);
    return res.json();
}


export async function updateThresholds(jobId: string, deltaGThreshold: number, atomPairCstThreshold: number) {
    const params = new URLSearchParams({
        delta_g_threshold: String(deltaGThreshold),
        atom_pair_cst_threshold: String(atomPairCstThreshold),
    });
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/thresholds?${params}`, {
        method: 'PATCH',
    });
    if (!res.ok) throw new Error(`Failed to update thresholds for job ${jobId}`);
    return res.json() as Promise<DockingJob>; // updated job with re-analyzed results
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


export async function cancelDocking(jobId: string) {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/cancel`, {
        method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to cancel docking for job ${jobId}`);
    return res.json();
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

export async function exportDatabase(onProgress?: (bytesReceived: number, total: number | null) => void) {
    const res = await fetch(`${API_BASE_URL}/database/export`, {
        method: 'GET',
    });
    if (!res.ok) {
        throw new Error((await res.json()).detail || 'Failed to export database')
    }

    const totalHeader = res.headers.get('content-length');
    const total = totalHeader ? parseInt(totalHeader, 10) : null;

    if (!res.body || !onProgress) {
        return res.blob();
    }

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    onProgress(0, total);
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        onProgress(received, total);
    }
    return new Blob(chunks as BlobPart[], { type: res.headers.get('content-type') || 'application/zip' });
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