// @ts-nocheck
/**
 * HTTP Service Layer - Usage Examples
 *
 * Comprehensive examples demonstrating all features of the enhanced HTTP service layer.
 */
import {
  ContentType,
  FileUploadHelper,
  HttpError,
  httpClient,
} from "@/services";

// ============================================================================
// 1. BASIC REQUESTS
// ============================================================================

/**
 * Simple GET request
 */
async function basicGet() {
  const response = await httpClient.auth.get<User>("/api/users/1");
  console.log(response.data); // User object
  console.log(response.status); // 200
  console.log(response.headers); // Response headers
}

/**
 * POST request with JSON data
 */
async function basicPost() {
  const userData = { name: "John", email: "john@example.com" };
  const response = await httpClient.auth.post<User>("/api/users", userData);
  console.log(response.data);
}

// ============================================================================
// 2. ERROR HANDLING
// ============================================================================

/**
 * Try-catch error handling
 */
async function errorHandling() {
  try {
    const response = await httpClient.auth.get("/api/users/999");
    console.log(response.data);
  } catch (error) {
    if (error instanceof HttpError) {
      console.log("Status:", error.status);
      console.log("Message:", error.message);

      if (error.isNotFound()) {
        console.log("User not found");
      } else if (error.isUnauthorized()) {
        console.log("Please login");
      } else if (error.isServerError()) {
        console.log("Server error occurred");
      }
    }
  }
}

/**
 * Safe error handling (no exceptions)
 */
async function safeErrorHandling() {
  const result = await httpClient.auth.requestSafe<User>({
    url: "/api/users/1",
    method: "GET",
  });

  if (result.success) {
    console.log("User:", result.data.data);
  } else {
    console.log("Error:", result.error.message);
  }
}

// ============================================================================
// 3. REQUEST CANCELLATION
// ============================================================================

/**
 * Cancel a request
 */
function requestCancellation() {
  const { request, cancel } = httpClient.auth.createCancellableRequest<User[]>({
    url: "/api/users",
    method: "GET",
  });

  // Start the request
  request
    .then((response) => console.log(response.data))
    .catch((error) => {
      if (error.message.includes("cancel")) {
        console.log("Request was cancelled");
      }
    });

  // Cancel after 1 second
  setTimeout(() => cancel("User cancelled"), 1000);
}

/**
 * React component with cleanup
 */
function useDataFetching() {
  // In React useEffect
  const { request, cancel } = httpClient.auth.createCancellableRequest({
    url: "/api/data",
    method: "GET",
  });

  request.then((response) => {
    // Handle response
  });

  // Cleanup on unmount
  return () => cancel("Component unmounted");
}

// ============================================================================
// 4. FILE UPLOADS
// ============================================================================

/**
 * Single file upload with progress
 */
async function singleFileUpload(file: File) {
  const response = await httpClient.auth.uploadFile("/api/upload", {
    file,
    fieldName: "document",
    fields: {
      userId: 123,
      category: "profile",
    },
    onProgress: (percentage) => {
      console.log(`Upload progress: ${percentage}%`);
    },
  });

  console.log("Uploaded:", response.data);
}

/**
 * Multiple file upload
 */
async function multipleFileUpload(files: File[]) {
  const response = await httpClient.auth.uploadFiles("/api/upload/multiple", {
    files,
    fieldName: "documents",
    fields: {
      userId: 123,
    },
    onProgress: (percentage) => {
      console.log(`Upload progress: ${percentage}%`);
    },
  });

  console.log("Uploaded files:", response.data);
}

/**
 * Manual FormData construction
 */
async function manualFormData(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", "123");

  const response = await httpClient.auth.post("/api/upload", formData, {
    contentType: ContentType.FORM_DATA,
    onUploadProgress: (event) => {
      console.log(`Uploaded: ${event.percentage}%`);
    },
  });

  console.log(response.data);
}

// ============================================================================
// 5. FILE DOWNLOADS
// ============================================================================

/**
 * Download file as blob
 */
async function downloadFile() {
  const blob = await httpClient.auth.downloadFile("/api/files/document.pdf", {
    onDownloadProgress: (event) => {
      console.log(`Downloaded: ${event.percentage}%`);
    },
  });

  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "document.pdf";
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download with custom response type
 */
async function downloadImage() {
  const response = await httpClient.public.get<Blob>("/api/images/photo.jpg", {
    responseType: "blob",
  });

  const imageUrl = URL.createObjectURL(response.data);
  // Use imageUrl in <img> tag
}

// ============================================================================
// 6. CUSTOM HEADERS & CONFIG
// ============================================================================

/**
 * Request with custom headers
 */
async function customHeaders() {
  const response = await httpClient.auth.get("/api/data", {
    headers: {
      "X-Custom-Header": "value",
      "X-Request-ID": crypto.randomUUID(),
    },
  });
}

/**
 * Request with timeout
 */
async function withTimeout() {
  try {
    const response = await httpClient.auth.get("/api/slow-endpoint", {
      timeout: 5000, // 5 seconds
    });
  } catch (error) {
    if (error instanceof HttpError && error.isNetworkError) {
      console.log("Request timed out");
    }
  }
}

// ============================================================================
// 7. QUERY PARAMETERS
// ============================================================================

/**
 * GET with query parameters
 */
async function withQueryParams() {
  const response = await httpClient.auth.get<User[]>("/api/users", {
    params: {
      page: 1,
      limit: 10,
      sort: "name",
      active: true,
    },
  });
  // Requests: /api/users?page=1&limit=10&sort=name&active=true
}

// ============================================================================
// 8. CONTENT-TYPE HANDLING
// ============================================================================

/**
 * Send form-urlencoded data
 */
async function formUrlEncoded() {
  const params = new URLSearchParams();
  params.append("username", "john");
  params.append("password", "secret");

  const response = await httpClient.public.post("/api/login", params, {
    contentType: ContentType.FORM_URLENCODED,
  });
}

/**
 * Send plain text
 */
async function plainText() {
  const response = await httpClient.auth.post("/api/notes", "This is a note", {
    contentType: ContentType.TEXT,
  });
}

// ============================================================================
// 9. FILE VALIDATION
// ============================================================================

/**
 * Validate file before upload
 */
async function validateAndUpload(file: File) {
  // Validate file size (max 5MB)
  if (!FileUploadHelper.validateFileSize(file, 5)) {
    throw new Error("File too large (max 5MB)");
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (!FileUploadHelper.validateFileType(file, allowedTypes)) {
    throw new Error("Invalid file type");
  }

  // Upload
  await httpClient.auth.uploadFile("/api/upload", { file });
}

// ============================================================================
// 10. REQUEST DEDUPLICATION
// ============================================================================

/**
 * Duplicate requests are automatically deduplicated
 */
async function requestDeduplication() {
  // These three requests will only make ONE actual HTTP call
  const [r1, r2, r3] = await Promise.all([
    httpClient.auth.get("/api/user"),
    httpClient.auth.get("/api/user"),
    httpClient.auth.get("/api/user"),
  ]);

  // All three get the same response
  console.log(r1.data === r2.data); // true
}

// ============================================================================
// TYPES
// ============================================================================

interface User {
  id: number;
  name: string;
  email: string;
}
