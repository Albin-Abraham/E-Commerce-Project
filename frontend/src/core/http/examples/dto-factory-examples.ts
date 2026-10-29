// @ts-nocheck
/**
 * DTO Factory Usage Examples
 *
 * Comprehensive examples demonstrating how to use RequestBuilder and ResponseParser
 * for various HTTP operations including file uploads, pagination, and API envelopes.
 *
 * **NOTE**: This file is for REFERENCE/DOCUMENTATION purposes only.
 * To use these examples in your application:
 * 1. Import your actual httpClient instance
 * 2. Copy the relevant example code
 * 3. Adapt it to your specific use case
 *
 * @module domain/http/examples
 */
import type { HttpResponse } from "../http.types";
import { RequestFactory, ResponseFactory } from "../index";

/**
 * IMPORTANT: Uncomment and import your actual httpClient instance
 * Example: import { httpClient } from "@services/http.instance";
 */
declare const httpClient: any;

/**
 * Example 1: Simple GET Request
 */
export async function example1_SimpleGetRequest() {
  const request = RequestFactory.get("/api/users")
    .withParams({ page: 1, limit: 10 })
    .withTimeout(5000)
    .build();

  const response = await httpClient.auth.request(request);
  console.log(response.data);
}

/**
 * Example 2: POST Request with JSON Body
 */
export async function example2_PostWithJson() {
  const request = RequestFactory.post("/api/users")
    .withJson({
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
    })
    .withTimeout(5000)
    .build();

  const response = await httpClient.auth.request(request);
  console.log("Created user:", response.data);
}

/**
 * Example 3: File Upload with Metadata
 */
export async function example3_FileUpload(file: File) {
  const request = RequestFactory.post("/api/upload")
    .withFile({
      file,
      fieldName: "document",
      fields: {
        userId: "123",
        category: "invoice",
        description: "Monthly invoice",
      },
      onProgress: (percentage) => {
        console.log(`Upload progress: ${percentage}%`);
      },
    })
    .withHeaders({ "X-Upload-Source": "web" })
    .build();

  const response = await httpClient.auth.request(request);
  console.log("Upload complete:", response.data);
}

/**
 * Example 4: Multiple File Upload
 */
export async function example4_MultipleFileUpload(files: File[]) {
  const request = RequestFactory.post("/api/bulk-upload")
    .withFiles({
      files,
      fieldName: "attachments",
      fields: {
        projectId: "proj-456",
        uploadedBy: "user123",
      },
      onProgress: (percentage) => {
        console.log(`Bulk upload: ${percentage}%`);
      },
    })
    .build();

  const response = await httpClient.auth.request(request);
  console.log("Bulk upload complete:", response.data);
}

/**
 * Example 5: Paginated Response Parsing
 */
export async function example5_PaginatedResponse() {
  const response = await httpClient.auth.get("/api/users", {
    params: { page: 1, page_size: 10 },
  });

  const paginated = ResponseFactory.parse(response).parsePaginated<{
    id: string;
    name: string;
  }>();

  console.log("Items:", paginated.items);
  console.log("Total:", paginated.total);
  console.log("Has next:", paginated.hasNext);
  console.log("Has previous:", paginated.hasPrevious);

  return paginated;
}

/**
 * Example 6: API Envelope Parsing
 */
export async function example6_EnvelopeResponse() {
  const response = await httpClient.auth.get("/api/profile");

  const envelope = ResponseFactory.parse(response).parseEnvelope<{
    id: string;
    name: string;
    email: string;
  }>();

  if (envelope.success) {
    console.log("User profile:", envelope.data);
    console.log("Message:", envelope.message);
  } else {
    console.error("Errors:", envelope.errors);
  }

  return envelope;
}

/**
 * Example 7: File Download
 */
export async function example7_FileDownload() {
  const response = await httpClient.auth.get("/api/report/download", {
    responseType: "blob",
  });

  const file = ResponseFactory.parse(response).parseFile();

  // Trigger download
  const link = document.createElement("a");
  link.href = file.url;
  link.download = file.filename;
  link.click();

  // Clean up
  setTimeout(() => URL.revokeObjectURL(file.url), 100);

  console.log(`Downloaded: ${file.filename} (${file.size} bytes)`);
}

/**
 * Example 8: Using RequestBuilder with Execute Methods
 */
export async function example8_ExecuteMethods() {
  const builder = RequestFactory.get("/api/users")
    .withParams({ page: 1 })
    .deduplicate();

  // Option 1: Execute and get raw response
  const response = await httpClient.auth.execute(builder);
  console.log(response.data);

  // Option 2: Execute and parse automatically
  const parser = await httpClient.auth.executeParsed(builder);
  const paginated = parser.parsePaginated();
  console.log(paginated.items);

  // Option 3: Execute with custom parser
  const users = await httpClient.auth.executeAndParse(
    builder,
    (res: HttpResponse<unknown>) => ResponseFactory.unwrap(res)
  );
  console.log(users);
}

/**
 * Example 9: Complex Request with Validation
 */
export async function example9_ComplexRequest(files: File[]) {
  const request = RequestFactory.post("/api/documents")
    .withFiles({
      files,
      fieldName: "attachments",
      fields: {
        projectId: "proj-123",
        category: "legal",
      },
    })
    .withParams({ notify: true })
    .withHeaders({ "X-Request-ID": crypto.randomUUID() })
    .validate((config) => {
      if (!config.data) {
        throw new Error("No files provided");
      }
      if (!config.params?.notify) {
        console.warn("Notifications disabled");
      }
    })
    .deduplicate()
    .withTimeout(30000)
    .build();

  const response = await httpClient.auth.request(request);
  const envelope = ResponseFactory.parse(response).parseEnvelope();

  return envelope;
}

/**
 * Example 10: Batch Requests with Parsing
 */
export async function example10_BatchRequests() {
  const userIds = ["1", "2", "3"];

  const requests = userIds.map((id) =>
    RequestFactory.get(`/api/users/${id}`).build()
  );

  const responses = await Promise.all(
    requests.map((req) => httpClient.auth.request(req))
  );

  const users = responses.map((r) => ResponseFactory.unwrap(r));
  console.log("Fetched users:", users);

  return users;
}

/**
 * Example 11: Custom Response Transformer
 */
export async function example11_CustomTransformer() {
  const response = await httpClient.auth.get("/api/user/123");

  // Transform snake_case API response to camelCase
  const user = ResponseFactory.parse(response).parse((data: any) => ({
    id: data.user_id,
    name: data.full_name,
    email: data.email_address,
    createdAt: new Date(data.created_at),
    isActive: data.is_active,
  }));

  console.log("Transformed user:", user);
  return user;
}

/**
 * Example 12: Request with Authentication
 */
export async function example12_AuthenticatedRequest(token: string) {
  const request = RequestFactory.get("/api/protected/data")
    .withAuth(token)
    .withParams({ include: "details" })
    .build();

  const response = await httpClient.public.request(request);
  return response.data;
}

/**
 * Example 13: PUT Request with Partial Update
 */
export async function example13_PartialUpdate() {
  const request = RequestFactory.patch("/api/users/123")
    .withJson({
      name: "Updated Name",
      email: "newemail@example.com",
    })
    .build();

  const response = await httpClient.auth.request(request);
  console.log("Updated user:", response.data);
}

/**
 * Example 14: DELETE Request
 */
export async function example14_DeleteRequest() {
  const request = RequestFactory.delete("/api/users/123")
    .withParams({ soft: true })
    .build();

  const response = await httpClient.auth.request(request);
  console.log("Delete response:", response.data);
}

/**
 * Example 15: Response Validation
 */
export async function example15_ResponseValidation() {
  const response = await httpClient.auth.get("/api/config");

  const config = ResponseFactory.parse(response)
    .validate((data: any) => {
      return data && typeof data === "object" && "version" in data;
    })
    .parse();

  console.log("Validated config:", config);
  return config;
}
