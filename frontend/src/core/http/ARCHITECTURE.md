# HTTP Layer Architecture

**Clean Architecture Implementation Guide**

This document explains the architecture of the HTTP layer, layer boundaries, dependency rules, and usage patterns.

---

## 📐 Architecture Overview

The HTTP layer follows **Clean Architecture** principles with three distinct layers:

```
┌─────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  configs/api/axios/                                │ │
│  │  - axios.http.client.ts  (Axios implementation)    │ │
│  │  - axios.instance.ts     (Axios configuration)     │ │
│  └────────────────────────────────────────────────────┘ │
│                          ↓ depends on                    │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  services/http/                                    │ │
│  │  - http.client.service.ts  (Use case orchestration)│ │
│  └────────────────────────────────────────────────────┘ │
│                          ↓ depends on                    │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                         │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  domain/http/                                      │ │
│  │  - http.client.interface.ts  (HttpClient interface)│ │
│  │  - http.types.ts            (Core types)           │ │
│  │  - http.error.ts            (Domain error model)   │ │
│  │  - http.content-type.ts     (Content utilities)    │ │
│  │  - http.headers.ts          (Header constants)     │ │
│  │  - http.dto.types.ts        (DTO types)            │ │
│  │  - http.request.factory.ts  (Request builder)      │ │
│  │  - http.response.factory.ts (Response parser)      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 Layer Responsibilities

### Domain Layer (`domain/http/`)

**Purpose**: Define framework-agnostic contracts and domain models

**Responsibilities**:

- Define `HttpClient` interface
- Define HTTP types (`HttpMethod`, `HttpRequestConfig`, `HttpResponse`, etc.)
- Define `HttpError` domain model
- Provide content-type utilities
- Define header constants
- Provide DTO types for common response formats
- Provide RequestBuilder for type-safe request construction
- Provide ResponseParser for response transformation

**Rules**:

- ✅ No framework dependencies (no Axios, no Fetch, no React)
- ✅ Pure TypeScript interfaces and types
- ✅ Can be used by any layer
- ❌ Cannot import from application or infrastructure layers

**Example**:

```typescript
// domain/http/http.client.interface.ts
export interface HttpClient {
  request<T>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
}
```

---

### Application Layer (`services/http/`)

**Purpose**: Orchestrate use cases and add application-level features

**Responsibilities**:

- Implement `BaseHTTPClientService` for use case orchestration
- Add request deduplication
- Provide convenience methods (get, post, put, etc.)
- Handle file uploads
- Provide safe error handling (Result type)
- Integrate RequestBuilder execution methods
- Integrate ResponseParser utilities

**Rules**:

- ✅ Depends on domain layer
- ✅ No framework dependencies
- ✅ Adds application-specific features
- ❌ Cannot import from infrastructure layer

**Example**:

```typescript
// services/http/http.client.service.ts
import { HttpClient } from "@/domain/http";

export class BaseHTTPClientService {
  constructor(private client: HttpClient) {}

  get<T>(url: string) {
    return this.client.request<T>({ url, method: "GET" });
  }
}
```

---

### Infrastructure Layer (`configs/api/axios/`)

**Purpose**: Implement domain interfaces using specific frameworks

**Responsibilities**:

- Implement `HttpClient` interface using Axios
- Handle Axios-specific configuration
- Transform Axios errors to `HttpError`
- Manage interceptors and retry logic

**Rules**:

- ✅ Depends on domain layer
- ✅ Contains framework-specific code (Axios)
- ✅ Implements domain interfaces
- ❌ Should not be imported by domain layer

**Example**:

```typescript
// configs/api/axios/axios.http.client.ts
import axios from "axios";

import { HttpClient } from "@/domain/http";

export class AxiosHttpClient implements HttpClient {
  constructor(private instance: AxiosInstance) {}

  async request<T>(config: HttpRequestConfig) {
    // Axios-specific implementation
  }
}
```

---

## 🔄 Dependency Flow

**The Dependency Rule**: Dependencies flow **inward only**

```
Infrastructure → Application → Domain
     ✅              ✅          ❌ (no outward dependencies)
```

### ✅ Correct Dependencies

```typescript
// Infrastructure imports from Domain
import { HttpClient } from "@/domain/http";
// Application imports from Domain
import { HttpError } from "@/domain/http";
// Infrastructure imports from Application (acceptable)
import { BaseHTTPClientService } from "@/services/http";
```

### ❌ Incorrect Dependencies

```typescript
// Domain CANNOT import from Application
// ❌
// Domain CANNOT import from Infrastructure
import { AxiosHttpClient } from "@/configs/api/axios";
// ❌

// Application CANNOT import from Infrastructure
import { AxiosAuthInstance } from "@/configs/api/axios";
import { BaseHTTPClientService } from "@/services/http";

// ❌
```

---

## 🚀 Usage Patterns

### Basic HTTP Request

```typescript
import { AxiosAuthInstance } from "@/configs/api/axios";
import { AxiosHttpClient } from "@/configs/api/axios/axios.http.client";
import { BaseHTTPClientService } from "@/services/http";

// Create infrastructure implementation
const axiosClient = new AxiosHttpClient(AxiosAuthInstance);

// Create application service
const httpService = new BaseHTTPClientService(axiosClient);

// Make request
const response = await httpService.get<User[]>("/api/users");
```

### With Request Deduplication

```typescript
// Prevent duplicate concurrent requests
const response = await httpService.get<User[]>("/api/users", {
  deduplicate: true,
});
```

### Safe Error Handling

```typescript
const result = await httpService.requestSafe<User>({
  url: "/api/user/123",
  method: "GET",
});

if (result.success) {
  console.log(result.data.data);
} else {
  if (result.error.isNotFound()) {
    console.log("User not found");
  } else if (result.error.isUnauthorized()) {
    redirectToLogin();
  }
}
```

### File Upload

```typescript
const response = await httpService.uploadFile("/api/upload", {
  file: selectedFile,
  fieldName: "avatar",
  fields: { userId: "123" },
  onProgress: (percentage) => {
    console.log(`Upload: ${percentage}%`);
  },
});
```

### Cancellable Request

```typescript
const { request, cancel } = httpService.createCancellableRequest<User[]>({
  url: "/api/users",
  method: "GET",
});

// Start request
request.then((response) => {
  console.log(response.data);
});

// Cancel if needed
setTimeout(() => cancel("User navigated away"), 5000);
```

### Using RequestBuilder (DTO Factory)

```typescript
import { RequestFactory } from "@/domain/http";

// Build a request with fluent API
const request = RequestFactory.post("/api/users")
  .withJson({ name: "John", email: "john@example.com" })
  .withTimeout(5000)
  .deduplicate()
  .build();

const response = await httpService.request(request);
```

### File Upload with RequestBuilder

```typescript
import { RequestFactory } from "@/domain/http";

const request = RequestFactory.post("/api/upload")
  .withFile({
    file: selectedFile,
    fieldName: "document",
    fields: { userId: "123", category: "invoice" },
    onProgress: (p) => console.log(`${p}%`),
  })
  .withHeaders({ "X-Upload-Source": "web" })
  .build();

await httpService.request(request);
```

### Using ResponseParser (DTO Factory)

```typescript
import { ResponseFactory } from "@/domain/http";

// Parse paginated response
const response = await httpService.get("/api/users", {
  params: { page: 1, page_size: 10 },
});

const paginated = ResponseFactory.parse(response).parsePaginated<User>();

console.log(paginated.items); // User[]
console.log(paginated.total); // 100
console.log(paginated.hasNext); // true
```

### Using Execute Methods with RequestBuilder

```typescript
import { RequestFactory } from "@/domain/http";

const builder = RequestFactory.get("/api/users").withParams({ page: 1 });

// Option 1: Execute and get ResponseParser
const parser = await httpService.executeParsed<User[]>(builder);
const paginated = parser.parsePaginated<User>();

// Option 2: Execute and parse with custom logic
const users = await httpService.executeAndParse(builder, (res) =>
  ResponseFactory.unwrap(res)
);
```

---

## 🏭 DTO Factory Pattern

The HTTP layer includes a **DTO (Data Transfer Object) Factory** pattern for centralized request/response handling.

### RequestBuilder

**Purpose**: Type-safe, fluent API for building HTTP requests

**Features**:

- Method chaining for readable request construction
- Integration with file upload helpers
- Built-in validation support
- Automatic content-type detection

**Example**:

```typescript
import { RequestFactory } from "@/domain/http";

const request = RequestFactory.post("/api/users")
  .withJson({ name: "John", email: "john@example.com" })
  .withTimeout(5000)
  .withHeaders({ "X-Custom-Header": "value" })
  .deduplicate()
  .validate((config) => {
    if (!config.data) throw new Error("Data required");
  })
  .build();
```

**Available Methods**:

- `withJson(data)` - Set JSON body
- `withFile(config)` - Add single file upload
- `withFiles(config)` - Add multiple file uploads
- `withParams(params)` - Add query parameters
- `withHeaders(headers)` - Add custom headers
- `withAuth(token)` - Add Bearer authentication
- `withTimeout(ms)` - Set request timeout
- `withContentType(type)` - Set content type
- `withResponseType(type)` - Set expected response type
- `deduplicate()` - Enable request deduplication
- `validate(fn)` - Add validation before building
- `build()` - Build final request config

### ResponseParser

**Purpose**: Centralized response parsing and normalization

**Features**:

- Parse common response formats (pagination, envelopes, files)
- Custom transformation support
- Response validation
- Type-safe parsing

**Example**:

```typescript
import { ResponseFactory } from "@/domain/http";

const response = await httpService.get("/api/users");

// Parse paginated response
const paginated = ResponseFactory.parse(response).parsePaginated<User>();

console.log(paginated.items); // User[]
console.log(paginated.total); // 100
console.log(paginated.hasNext); // true
```

**Available Methods**:

- `parse<R>(transformer?)` - Generic parsing with optional transformation
- `parsePaginated<T>()` - Parse paginated responses
- `parseEnvelope<T>()` - Parse API envelope responses
- `parseFile()` - Parse file download responses
- `validate(fn)` - Validate response structure
- `raw()` - Get raw HTTP response

### DTO Types

**Standard response structures**:

```typescript
// Paginated response
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// API envelope
interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

// File download
interface FileDownload {
  blob: Blob;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}
```

### Integration with BaseHTTPClientService

The application layer provides execute methods for using builders:

```typescript
// Execute and get raw response
const response = await httpService.execute<User>(builder);

// Execute and parse automatically
const parser = await httpService.executeParsed<User[]>(builder);
const paginated = parser.parsePaginated<User>();

// Execute with custom parser
const users = await httpService.executeAndParse(builder, (res) =>
  ResponseFactory.unwrap(res)
);
```

---

## 🔧 Extending the Architecture

### Adding a New HTTP Client Implementation

1. **Create implementation in infrastructure layer**:

```typescript
// configs/api/fetch/fetch.http.client.ts
import { HttpClient, HttpRequestConfig, HttpResponse } from "@/domain/http";

export class FetchHttpClient implements HttpClient {
  async request<T>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    // Fetch implementation
  }
}
```

2. **Use it with the application service**:

```typescript
const fetchClient = new FetchHttpClient();
const httpService = new BaseHTTPClientService(fetchClient);
```

### Adding Application-Level Features

Add features to `BaseHTTPClientService`:

```typescript
// services/http/http.client.service.ts
export class BaseHTTPClientService {
  // Existing methods...

  // New feature: Retry with exponential backoff
  async requestWithRetry<T>(
    config: HttpRequestConfig,
    maxRetries: number = 3
  ): Promise<HttpResponse<T>> {
    // Implementation
  }
}
```

### Adding Domain Types

Add new types to domain layer:

```typescript
// domain/http/http.types.ts
export interface HttpCacheConfig {
  enabled: boolean;
  ttl: number;
  key: string;
}
```

---

## 📋 Testing Strategy

### Domain Layer Tests

Test pure logic without mocks:

```typescript
import { HttpError } from "@/domain/http";

describe("HttpError", () => {
  it("should identify client errors", () => {
    const error = new HttpError("Not Found", 404);
    expect(error.isClientError()).toBe(true);
    expect(error.isNotFound()).toBe(true);
  });
});
```

### Application Layer Tests

Test with mocked HttpClient:

```typescript
import { HttpClient } from "@/domain/http";
import { BaseHTTPClientService } from "@/services/http";

const mockClient: HttpClient = {
  request: jest.fn(),
};

const service = new BaseHTTPClientService(mockClient);

describe("BaseHTTPClientService", () => {
  it("should make GET request", async () => {
    await service.get("/api/users");
    expect(mockClient.request).toHaveBeenCalledWith({
      url: "/api/users",
      method: "GET",
    });
  });
});
```

### Infrastructure Layer Tests

Test with real Axios instance:

```typescript
import axios from "axios";

import { AxiosHttpClient } from "@/configs/api/axios/axios.http.client";

const instance = axios.create();
const client = new AxiosHttpClient(instance);

describe("AxiosHttpClient", () => {
  it("should transform Axios errors to HttpError", async () => {
    // Test error transformation
  });
});
```

---

## ⚠️ Common Pitfalls

### 1. Importing from Wrong Layer

```typescript
// ❌ BAD: Domain importing from infrastructure
// domain/http/http.client.interface.ts
import { AxiosInstance } from "axios";

// ❌

// ✅ GOOD: Keep domain framework-agnostic
export interface HttpClient {
  request<T>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
}
```

### 2. Leaking Framework Details

```typescript
// ❌ BAD: Exposing Axios types in domain
export interface HttpRequestConfig {
  axiosConfig?: AxiosRequestConfig; // ❌
}

// ✅ GOOD: Framework-agnostic types
export interface HttpRequestConfig {
  url: string;
  method: HttpMethod;
  data?: unknown;
}
```

### 3. Bypassing Abstractions

```typescript
// ❌ BAD: Using Axios directly in application code
import axios from "axios";
const response = await axios.get("/api/users"); // ❌

// ✅ GOOD: Use the abstraction
const response = await httpService.get<User[]>("/api/users");
```

---

## 🎓 Key Principles

1. **Dependency Inversion**: Depend on abstractions, not concretions
2. **Single Responsibility**: Each layer has one clear purpose
3. **Open/Closed**: Open for extension, closed for modification
4. **Interface Segregation**: Small, focused interfaces
5. **Dependency Rule**: Dependencies flow inward only

---

## 📚 Further Reading

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
