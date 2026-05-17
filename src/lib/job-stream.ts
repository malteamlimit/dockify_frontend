import { DockingJob } from "@/app/models";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_URL = `${API_BASE_URL.replace(/^http/, 'ws')}/jobs/status`;

/** Connection state of the global job stream, surfaced to the UI. */
export type StreamStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

/** A stream message is either a full job or a deletion notice. */
type JobMessage = DockingJob | { deleted: string };

export interface JobStreamHandlers {
  /** A job was created or changed. */
  onJob: (job: DockingJob) => void;
  /** A job was deleted (possibly by another client). */
  onDeleted: (jobId: string) => void;
  /** The connection state changed. */
  onStatusChange: (status: StreamStatus) => void;
}

const MAX_BACKOFF_MS = 30_000;
const BASE_BACKOFF_MS = 1_000;

// The stream is a process-wide singleton: one WebSocket feeds every job.
let ws: WebSocket | null = null;
let handlers: JobStreamHandlers | null = null;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let stopped = false;

function emitStatus(status: StreamStatus) {
  handlers?.onStatusChange(status);
}

function scheduleReconnect() {
  if (stopped || reconnectTimer) return;
  emitStatus('reconnecting');
  // Exponential backoff: 1s, 2s, 4s, ... capped at 30s.
  const delay = Math.min(BASE_BACKOFF_MS * 2 ** reconnectAttempts, MAX_BACKOFF_MS);
  reconnectAttempts++;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    open();
  }, delay);
}

function open() {
  emitStatus(reconnectAttempts === 0 ? 'connecting' : 'reconnecting');
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    reconnectAttempts = 0;
    emitStatus('open');
  };

  ws.onmessage = (event) => {
    let data: JobMessage;
    try {
      data = JSON.parse(event.data);
    } catch (e) {
      console.error('Job stream: malformed message', e);
      return;
    }
    if ('deleted' in data) {
      handlers?.onDeleted(data.deleted);
    } else {
      handlers?.onJob(data);
    }
  };

  // onclose fires after onerror too, so reconnection is handled there only.
  ws.onerror = () => {};

  ws.onclose = () => {
    ws = null;
    if (!stopped) scheduleReconnect();
  };
}

/**
 * Start the global job stream. Idempotent: calling it again while a connection
 * (or a pending reconnect) exists only refreshes the handlers.
 */
export function startJobStream(streamHandlers: JobStreamHandlers) {
  handlers = streamHandlers;
  if (ws || reconnectTimer) return;
  stopped = false;
  reconnectAttempts = 0;
  open();
}

/** Stop the stream and cancel any pending reconnect. */
export function stopJobStream() {
  stopped = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
  emitStatus('closed');
}
