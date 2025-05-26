const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getAllJobs() {
  const res = await fetch(`${API_BASE_URL}/data`, {
    method: 'GET',
  });
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json(); // list[DockingJobPreview]
}

export async function getJobById(jobId: string) {
  const res = await fetch(`${API_BASE_URL}/data/${jobId}`, {
    method: 'GET',
  });
  if (!res.ok) throw new Error(`Failed to fetch job ${jobId}`);
  return res.json(); // DockingJobPublic
}

export async function deleteJobById(jobId: string) {
  const res = await fetch(`${API_BASE_URL}/data/${jobId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete job ${jobId}`);
  return res.json(); // message
}
