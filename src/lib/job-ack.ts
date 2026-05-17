/**
 * Tracks which terminal job results the user has already been notified about,
 * persisted in localStorage. This lets the app show a one-time toast for jobs
 * that finished while the page was closed, without re-toasting on every reload.
 *
 * The stored value is a signature `${status}:${runs}` so that re-running an
 * already-completed job (which bumps `runs`) is detected as a new result.
 */

const STORAGE_KEY = 'dockify-acknowledged-jobs';

type AckMap = Record<string, string>;

function read(): AckMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AckMap) : {};
  } catch {
    return {};
  }
}

function write(map: AckMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota / serialization errors -- acknowledgements are best-effort.
  }
}

/** Signature identifying a specific terminal outcome of a job. */
export function jobSignature(status: string, runs: number): string {
  return `${status}:${runs}`;
}

/** The acknowledged signature for a job, or undefined if never acknowledged. */
export function getAck(jobId: string): string | undefined {
  return read()[jobId];
}

/** Record that the user has been notified about this job outcome. */
export function setAck(jobId: string, signature: string): void {
  const map = read();
  map[jobId] = signature;
  write(map);
}

/** Drop acknowledgements for jobs that no longer exist, keeping storage small. */
export function pruneAcks(existingJobIds: Iterable<string>): void {
  const keep = new Set(existingJobIds);
  const map = read();
  let changed = false;
  for (const id of Object.keys(map)) {
    if (!keep.has(id)) {
      delete map[id];
      changed = true;
    }
  }
  if (changed) write(map);
}
