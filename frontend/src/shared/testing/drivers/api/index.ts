/**
 * API Driver - Semantic Layer for API Testing
 * 
 * Provides semantic operations for testing API interactions, mocking, and contract validation.
 */

import { http, HttpResponse, type HttpHandler } from 'msw';
import { server } from '../../msw/server';
import { BaseDriver } from '../base';

export interface MockResponse {
  status?: number;
  headers?: Record<string, string>;
  body?: any;
  delay?: number;
}

export interface RequestMatcher {
  method?: string;
  url: string | RegExp;
  body?: any;
  headers?: Record<string, string>;
}

export class ApiDriver extends BaseDriver {
  private handlers: Map<string, HttpHandler> = new Map();

  constructor(container: HTMLElement = document.body) {
    super(container);
  }

  // --- Request Mocking ---

  public mockRequest(matcher: RequestMatcher, response: MockResponse) {
    const handler = this.createHandler(matcher, response);
    const key = this.getHandlerKey(matcher);
    this.handlers.set(key, handler);
    server.use(handler);
    return this;
  }

  public mockGet(url: string | RegExp, response: MockResponse) {
    return this.mockRequest({ method: 'GET', url }, response);
  }

  public mockPost(url: string | RegExp, response: MockResponse) {
    return this.mockRequest({ method: 'POST', url }, response);
  }

  public mockPut(url: string | RegExp, response: MockResponse) {
    return this.mockRequest({ method: 'PUT', url }, response);
  }

  public mockDelete(url: string | RegExp, response: MockResponse) {
    return this.mockRequest({ method: 'DELETE', url }, response);
  }

  public mockPatch(url: string | RegExp, response: MockResponse) {
    return this.mockRequest({ method: 'PATCH', url }, response);
  }

  private createHandler(matcher: RequestMatcher, response: MockResponse): HttpHandler {
    const method = matcher.method?.toLowerCase() || 'get';
    const url = matcher.url;

    const handler = (http as any)[method](url, async ({ request }: { request: Request }) => {
      // Validate request body if provided
      if (matcher.body) {
        const requestBody = await request.json().catch(() => null);
        if (JSON.stringify(requestBody) !== JSON.stringify(matcher.body)) {
          return HttpResponse.json(
            { error: 'Request body mismatch' },
            { status: 400 }
          );
        }
      }

      // Validate headers if provided
      if (matcher.headers) {
        for (const [key, value] of Object.entries(matcher.headers)) {
          const requestValue = request.headers.get(key);
          if (requestValue !== value) {
            return HttpResponse.json(
              { error: `Header mismatch: ${key}` },
              { status: 400 }
            );
          }
        }
      }

      // Apply delay if specified
      if (response.delay) {
        await new Promise((resolve) => setTimeout(resolve, response.delay));
      }

      return HttpResponse.json(response.body, {
        status: response.status || 200,
        headers: response.headers,
      });
    });

    return handler;
  }

  private getHandlerKey(matcher: RequestMatcher): string {
    return `${matcher.method || 'GET'}:${matcher.url.toString()}`;
  }

  // --- Handler Management ---

  public restoreHandlers() {
    server.restoreHandlers();
    this.handlers.clear();
    return this;
  }

  public resetHandlers() {
    server.resetHandlers();
    this.handlers.clear();
    return this;
  }

  public getHandlerCount(): number {
    return this.handlers.size;
  }

  // --- Scenario Helpers ---

  public mockPaginatedList<T>(
    url: string | RegExp,
    items: T[],
    options: { pageSize?: number; totalCount?: number } = {}
  ) {
    const pageSize = options.pageSize || 10;
    const totalCount = options.totalCount || items.length;

    return this.mockRequest(
      { method: 'GET', url },
      {
        status: 200,
        body: (request: Request) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get('page') || '1') - 1;
          const size = parseInt(url.searchParams.get('pageSize') || String(pageSize));
          
          const start = page * size;
          const end = start + size;
          const pageItems = items.slice(start, end);

          return HttpResponse.json({
            data: pageItems,
            pagination: {
              page: page + 1,
              pageSize: size,
              totalCount,
              totalPages: Math.ceil(totalCount / size),
            },
          });
        },
    });
  }

  public mockEntityCrud<T extends { id: string }>(
    baseUrl: string,
    initialEntities: T[] = []
  ) {
    const entities = new Map<string, T>();
    initialEntities.forEach((e) => entities.set(e.id, e));

    // GET list
    this.mockGet(baseUrl, {
      status: 200,
      body: () => HttpResponse.json(Array.from(entities.values())),
    });

    // GET single
    this.mockGet(new RegExp(`${baseUrl}/([^/]+)`), {
      status: 200,
      body: (request: Request) => {
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop() || '';
        const entity = entities.get(id);
        if (!entity) {
          return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        }
        return HttpResponse.json(entity);
      },
    });

    // POST create
    this.mockPost(baseUrl, {
      status: 201,
      body: async (request: Request) => {
        const body = await request.json();
        const newEntity = { ...body, id: crypto.randomUUID() } as T;
        entities.set(newEntity.id, newEntity);
        return HttpResponse.json(newEntity, { status: 201 });
      },
    });

    // PUT update
    this.mockPut(new RegExp(`${baseUrl}/([^/]+)`), {
      status: 200,
      body: async (request: Request) => {
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop() || '';
        const body = await request.json();
        const existing = entities.get(id);
        if (!existing) {
          return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        }
        const updated = { ...existing, ...body, id } as T;
        entities.set(id, updated);
        return HttpResponse.json(updated);
      },
    });

    // DELETE
    this.mockDelete(new RegExp(`${baseUrl}/([^/]+)`), {
      status: 204,
      body: (request: Request) => {
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop() || '';
        const existed = entities.delete(id);
        if (!existed) {
          return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        }
        return new HttpResponse(null, { status: 204 });
      },
    });

    return {
      getEntities: () => Array.from(entities.values()),
      reset: () => {
        entities.clear();
        initialEntities.forEach((e) => entities.set(e.id, e));
      },
    };
  }

  // --- Contract Validation ---

  public validateContract(
    url: string | RegExp,
    expectedSchema: {
      request?: any;
      response?: any;
    }
  ) {
    // This would integrate with a schema validator like Zod or AJV
    // For now, we'll add a custom handler that validates
    this.mockRequest(
      { method: 'GET', url },
      {
        status: 200,
        body: async (request: Request) => {
          if (expectedSchema.request) {
            const _body = await request.json().catch(() => ({}));
            // Validate request against schema
            // This is a placeholder - integrate with Zod/AJV
          }
          
          return HttpResponse.json({ valid: true });
        },
      }
    );
  }

  // --- Network Recording ---

  private recordedRequests: Array<{
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any;
    timestamp: number;
  }> = [];

  public startRecording() {
    this.recordedRequests = [];
    // This would integrate with MSW's request interception
    return this;
  }

  public stopRecording() {
    return this.recordedRequests;
  }

  public getRecordedRequests() {
    return [...this.recordedRequests];
  }

  public clearRecordedRequests() {
    this.recordedRequests = [];
    return this;
  }

  // --- Assertions ---

  public expectRequestMade(matcher: RequestMatcher) {
    // Check if a request matching the criteria was made
    const recorded = this.recordedRequests.find((req) => {
      if (matcher.method && req.method !== matcher.method.toUpperCase()) return false;
      if (matcher.url instanceof RegExp) {
        if (!matcher.url.test(req.url)) return false;
      } else if (!req.url.includes(matcher.url)) return false;
      if (matcher.body && JSON.stringify(req.body) !== JSON.stringify(matcher.body)) return false;
      if (matcher.headers) {
        for (const [key, value] of Object.entries(matcher.headers)) {
          if (req.headers[key] !== value) return false;
        }
      }
      return true;
    });

    if (!recorded) {
      throw new Error(`Expected request matching ${JSON.stringify(matcher)} was not made`);
    }
    return recorded;
  }

  public expectRequestCount(count: number) {
    if (this.recordedRequests.length !== count) {
      throw new Error(`Expected ${count} requests, but ${this.recordedRequests.length} were made`);
    }
  }
}