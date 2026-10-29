import { server } from "@testing/msw/server";
import type { TestContext } from "./lifecycle";
import { addCleanupFn } from "./lifecycle";

let originalFetch: typeof fetch | null = null;
let fetchMocks: Map<string, any> = new Map();
let requestInterceptors: Array<(request: Request) => Request | Promise<Request>> = [];
let responseInterceptors: Array<(response: Response) => Response | Promise<Response>> = [];

export function setupNetworkIsolation(): void {
  if (originalFetch) return;
  
  originalFetch = globalThis.fetch.bind(globalThis);
  
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let request: Request;
    try {
      request = input instanceof Request ? input : new Request(input, init);
    } catch (error) {
      // Handle relative URLs without base (e.g., /api/health in jsdom)
      // Fall back to original fetch without interception
      return originalFetch!(input, init);
    }
    
    for (const interceptor of requestInterceptors) {
      request = await interceptor(request);
    }
    
    const response = await originalFetch!(request);
    
    for (const interceptor of responseInterceptors) {
      return await interceptor(response.clone());
    }
    
    return response;
  };
}

export function teardownNetworkIsolation(): void {
  if (!originalFetch) return;
  
  globalThis.fetch = originalFetch;
  
  originalFetch = null;
  fetchMocks.clear();
  requestInterceptors = [];
  responseInterceptors = [];
}

export function resetNetworkHandlers(): void {
  server.resetHandlers();
}

export function addRequestInterceptor(fn: (request: Request) => Request | Promise<Request>): void {
  requestInterceptors.push(fn);
}

export function removeRequestInterceptor(fn: (request: Request) => Request | Promise<Request>): void {
  const index = requestInterceptors.indexOf(fn);
  if (index !== -1) requestInterceptors.splice(index, 1);
}

export function addResponseInterceptor(fn: (response: Response) => Response | Promise<Response>): void {
  responseInterceptors.push(fn);
}

export function removeResponseInterceptor(fn: (response: Response) => Response | Promise<Response>): void {
  const index = responseInterceptors.indexOf(fn);
  if (index !== -1) responseInterceptors.splice(index, 1);
}

export function mockFetch(url: string | RegExp, response: any, options: { status?: number; headers?: Record<string, string>; delay?: number } = {}): void {
  const key = url instanceof RegExp ? url.source : url;
  fetchMocks.set(key, { response, options });
}

export function unmockFetch(url: string | RegExp): void {
  const key = url instanceof RegExp ? url.source : url;
  fetchMocks.delete(key);
}

export function clearFetchMocks(): void {
  fetchMocks.clear();
}

export function getFetchMocks(): Map<string, any> {
  return new Map(fetchMocks);
}

export function setupMSWIsolation(): void {
  server.listen({ onUnhandledRequest: "error" });
}

export function teardownMSWIsolation(): void {
  server.close();
}

export function resetMSWHandlers(): void {
  server.resetHandlers();
}

export function useMSWHandler(...handlers: any[]): void {
  server.use(...handlers);
}

export function restoreMSWHandlers(): void {
  server.restoreHandlers();
}

export async function setupTestNetworkIsolation(context: TestContext): Promise<void> {
  setupNetworkIsolation();
  
  addCleanupFn(context, () => {
    teardownNetworkIsolation();
  });
}

export async function teardownTestNetworkIsolation(_context: TestContext): Promise<void> {
  clearFetchMocks();
  requestInterceptors = [];
  responseInterceptors = [];
}

export function createNetworkRecorder(): {
  start: () => void;
  stop: () => NetworkRecord[];
  getRecords: () => NetworkRecord[];
} {
  const records: NetworkRecord[] = [];
  let _recording = false;
  
  const originalFetch = globalThis.fetch.bind(globalThis);
  
  return {
    start: () => {
      _recording = true;
      records.length = 0;
      
      globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const start = Date.now();
        const request = input instanceof Request ? input : new Request(input, init);
        
        try {
          const response = await originalFetch(request);
          const end = Date.now();
          
          const clonedResponse = response.clone();
          let responseBody: string | undefined;
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json") || contentType?.includes("text/")) {
            responseBody = await clonedResponse.text();
          }
          
          records.push({
            url: request.url,
            method: request.method,
            requestHeaders: Object.fromEntries((request.headers as any).entries()),
            requestBody: request.body ? await request.clone().text() : undefined,
            responseStatus: response.status,
            responseHeaders: Object.fromEntries((response.headers as any).entries()),
            responseBody,
            duration: end - start,
            timestamp: start,
          });
          
          return response;
        } catch (error) {
          const end = Date.now();
          records.push({
            url: request.url,
            method: request.method,
            requestHeaders: Object.fromEntries((request.headers as any).entries()),
            requestBody: request.body ? await request.clone().text() : undefined,
            error: error instanceof Error ? error.message : String(error),
            duration: end - start,
            timestamp: start,
          });
          throw error;
        }
      };
    },
    stop: () => {
      globalThis.fetch = originalFetch;
      _recording = false;
      return [...records];
    },
    getRecords: () => [...records],
  };
}

export interface NetworkRecord {
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  error?: string;
  duration: number;
  timestamp: number;
}

export function createMockServer(_handlers: Map<string, any> = new Map()): {
  get: (url: string) => any;
  post: (url: string) => any;
  put: (url: string) => any;
  delete: (url: string) => any;
  patch: (url: string) => any;
  handle: (method: string, url: string, handler: (request: any) => any) => void;
  reset: () => void;
} {
  const routes = new Map<string, Map<string, (request: any) => any>>();
  
  function addRoute(method: string, url: string, handler: (request: any) => any): void {
    if (!routes.has(method)) {
      routes.set(method, new Map());
    }
    routes.get(method)!.set(url, handler);
  }
  
  function _matchRoute(method: string, url: string): ((request: any) => any) | undefined {
    const methodRoutes = routes.get(method);
    if (!methodRoutes) return undefined;
    
    for (const [pattern, handler] of methodRoutes) {
      if (pattern === url || new RegExp(pattern).test(url)) {
        return handler;
      }
    }
    return undefined;
  }
  
  return {
    get: (url: string) => (handler: (request: any) => any) => addRoute("GET", url, handler),
    post: (url: string) => (handler: (request: any) => any) => addRoute("POST", url, handler),
    put: (url: string) => (handler: (request: any) => any) => addRoute("PUT", url, handler),
    delete: (url: string) => (handler: (request: any) => any) => addRoute("DELETE", url, handler),
    patch: (url: string) => (handler: (request: any) => any) => addRoute("PATCH", url, handler),
    handle: (method: string, url: string, handler: (request: any) => any) => addRoute(method, url, handler),
    reset: () => routes.clear(),
  };
}