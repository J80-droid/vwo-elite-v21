export interface SyncEvent<T = unknown> {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
}

export class SyncLog {
  private events: SyncEvent<unknown>[] = [];
  private listeners: Set<(event: SyncEvent<unknown>) => void> = new Set();

  append<T>(type: string, payload: T): SyncEvent<T> {
    const event: SyncEvent<T> = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now(),
    };

    this.events.push(event as SyncEvent<unknown>);
    this.listeners.forEach((l) => l(event as SyncEvent<unknown>));
    return event;
  }

  getEvents(afterTimestamp: number = 0): SyncEvent<unknown>[] {
    return this.events.filter((e) => e.timestamp > afterTimestamp);
  }

  subscribe(listener: (event: SyncEvent<unknown>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  clear() {
    this.events = [];
  }
}

// Singleton
let instance: SyncLog | null = null;
export function getSyncLog() {
  if (!instance) instance = new SyncLog();
  return instance;
}
