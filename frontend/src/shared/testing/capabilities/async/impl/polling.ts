import type { WaitOptions } from "../types";

export interface ResourcePollerOptions<T> {
  fetchResource: () => Promise<T>;
  predicate: (resource: T) => boolean;
  interval?: number;
  timeout?: number;
  onPoll?: (resource: T, attempt: number) => void;
}

export interface ListPollerOptions<T> {
  fetchList: () => Promise<T[]>;
  predicate: (item: T) => boolean;
  interval?: number;
  timeout?: number;
  onPoll?: (items: T[], attempt: number) => void;
}

export interface CountPollerOptions {
  getCount: () => Promise<number>;
  expectedCount: number;
  interval?: number;
  timeout?: number;
  onPoll?: (count: number, attempt: number) => void;
}

export async function pollForResource<T>(
  options: ResourcePollerOptions<T>
): Promise<T> {
  const { fetchResource, predicate, interval = 1000, timeout = 30000, onPoll } = options;
  const start = Date.now();
  let attempt = 0;
  
  while (Date.now() - start < timeout) {
    attempt++;
    const resource = await fetchResource();
    
    if (onPoll) {
      onPoll(resource, attempt);
    }
    
    if (predicate(resource)) {
      return resource;
    }
    
    await new Promise(r => setTimeout(r, interval));
  }
  
  throw new Error(`Resource polling timeout after ${timeout}ms (${attempt} attempts)`);
}

export async function pollForListItem<T>(
  options: ListPollerOptions<T>
): Promise<T> {
  const { fetchList, predicate, interval = 1000, timeout = 30000, onPoll } = options;
  const start = Date.now();
  let attempt = 0;
  
  while (Date.now() - start < timeout) {
    attempt++;
    const items = await fetchList();
    
    if (onPoll) {
      onPoll(items, attempt);
    }
    
    const found = items.find(predicate);
    if (found) {
      return found;
    }
    
    await new Promise(r => setTimeout(r, interval));
  }
  
  throw new Error(`List item polling timeout after ${timeout}ms (${attempt} attempts)`);
}

export async function pollForCount(
  options: CountPollerOptions
): Promise<number> {
  const { getCount, expectedCount, interval = 1000, timeout = 30000, onPoll } = options;
  const start = Date.now();
  let attempt = 0;
  
  while (Date.now() - start < timeout) {
    attempt++;
    const count = await getCount();
    
    if (onPoll) {
      onPoll(count, attempt);
    }
    
    if (count >= expectedCount) {
      return count;
    }
    
    await new Promise(r => setTimeout(r, interval));
  }
  
  throw new Error(`Count polling timeout after ${timeout}ms (${attempt} attempts), expected ${expectedCount}`);
}

export async function pollUntilExists<T>(
  getItems: () => Promise<T[]>,
  filter: (item: T) => boolean,
  options: WaitOptions = {}
): Promise<T> {
  const { timeout = 10000, interval = 500, message } = options;
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const items = await getItems();
    const found = items.find(filter);
    if (found) return found;
    await new Promise(r => setTimeout(r, interval));
  }
  
  throw new Error(message || `Item not found within ${timeout}ms`);
}

export async function pollUntilGone<T>(
  getItems: () => Promise<T[]>,
  filter: (item: T) => boolean,
  options: WaitOptions = {}
): Promise<void> {
  const { timeout = 10000, interval = 500, message } = options;
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const items = await getItems();
    const found = items.find(filter);
    if (!found) return;
    await new Promise(r => setTimeout(r, interval));
  }
  
  throw new Error(message || `Item still exists after ${timeout}ms`);
}

export async function pollForCondition(
  condition: () => Promise<boolean>,
  options: WaitOptions = {}
): Promise<void> {
  const { timeout = 10000, interval = 500, message } = options;
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) return;
    await new Promise(r => setTimeout(r, interval));
  }
  
  throw new Error(message || `Condition not met within ${timeout}ms`);
}

export async function waitForApiResponse<T>(
  fetchFn: () => Promise<T>,
  predicate: (response: T) => boolean,
  options: WaitOptions = {}
): Promise<T> {
  const { timeout = 30000, interval = 1000, message } = options;
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    try {
      const response = await fetchFn();
      if (predicate(response)) return response;
    } catch (error) {
      // Ignore fetch errors, keep polling
    }
    await new Promise(r => setTimeout(r, interval));
  }
  
  throw new Error(message || `API response condition not met within ${timeout}ms`);
}

export async function waitForWebSocketMessage<T>(
  ws: WebSocket,
  predicate: (message: T) => boolean,
  options: WaitOptions = {}
): Promise<T> {
  const { timeout = 10000, message: errorMessage } = options;
  
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage || `WebSocket message timeout after ${timeout}ms`));
    }, timeout);
    
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as T;
        if (predicate(data)) {
          clearTimeout(timer);
          ws.removeEventListener("message", handler);
          resolve(data);
        }
      } catch {
        // Ignore parse errors
      }
    };
    
    ws.addEventListener("message", handler);
  });
}

export async function waitForEvent<E>(
  emitter: EventTarget,
  eventType: string,
  predicate: (event: E) => boolean,
  options: WaitOptions = {}
): Promise<E> {
  const { timeout = 10000, message: errorMessage } = options;
  
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      emitter.removeEventListener(eventType, handler);
      reject(new Error(errorMessage || `Event ${eventType} timeout after ${timeout}ms`));
    }, timeout);
    
    const handler = (event: Event) => {
      if (predicate(event as E)) {
        clearTimeout(timer);
        emitter.removeEventListener(eventType, handler);
        resolve(event as E);
      }
    };
    
    emitter.addEventListener(eventType, handler);
  });
}

export async function waitForCustomEvent<T>(
  eventName: string,
  predicate: (detail: T) => boolean,
  options: WaitOptions = {}
): Promise<T> {
  const event = await waitForEvent<CustomEvent<T>>(window, eventName, (e: CustomEvent<T>) => predicate(e.detail), options);
  return event.detail;
}

export function createPollingSubscription<T>(
  fetchFn: () => Promise<T>,
  interval: number = 5000
): {
  start: () => void;
  stop: () => void;
  subscribe: (callback: (data: T) => void) => () => void;
} {
  let timer: ReturnType<typeof setInterval> | null = null;
  const subscribers = new Set<(data: T) => void>();
  
  const poll = async () => {
    try {
      const data = await fetchFn();
      subscribers.forEach(cb => cb(data));
    } catch (error) {
      console.error("Polling error:", error);
    }
  };
  
  return {
    start: () => {
      if (timer) return;
      timer = setInterval(poll, interval);
      poll(); // Initial fetch
    },
    stop: () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
    subscribe: (callback: (data: T) => void) => {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    }
  };
}