// configs/api/axios.constants.ts

/** All HTTP status codes */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,

  // Server errors
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/** Type for any HTTP status code */
export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

/** Human-readable mapping of status codes */
export const HTTP_STATUS_TEXT: Record<HttpStatusCode, string> = {
  [HTTP_STATUS.OK]: "OK",
  [HTTP_STATUS.CREATED]: "Created",
  [HTTP_STATUS.NO_CONTENT]: "No Content",

  [HTTP_STATUS.BAD_REQUEST]: "Bad Request",
  [HTTP_STATUS.UNAUTHORIZED]: "Unauthorized",
  [HTTP_STATUS.FORBIDDEN]: "Forbidden",
  [HTTP_STATUS.NOT_FOUND]: "Not Found",
  [HTTP_STATUS.CONFLICT]: "Conflict",
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: "Unprocessable Entity",

  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: "Internal Server Error",
  [HTTP_STATUS.BAD_GATEWAY]: "Bad Gateway",
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: "Service Unavailable",
  [HTTP_STATUS.GATEWAY_TIMEOUT]: "Gateway Timeout",
};

/** Grouped constants for clarity */
export const HTTP_CLIENT_ERROR = {
  BAD_REQUEST: HTTP_STATUS.BAD_REQUEST,
  UNAUTHORIZED: HTTP_STATUS.UNAUTHORIZED,
  FORBIDDEN: HTTP_STATUS.FORBIDDEN,
  NOT_FOUND: HTTP_STATUS.NOT_FOUND,
  CONFLICT: HTTP_STATUS.CONFLICT,
  UNPROCESSABLE_ENTITY: HTTP_STATUS.UNPROCESSABLE_ENTITY,
} as const;

export const HTTP_SERVER_ERROR = {
  INTERNAL_SERVER_ERROR: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  BAD_GATEWAY: HTTP_STATUS.BAD_GATEWAY,
  SERVICE_UNAVAILABLE: HTTP_STATUS.SERVICE_UNAVAILABLE,
  GATEWAY_TIMEOUT: HTTP_STATUS.GATEWAY_TIMEOUT,
} as const;

/** Optional types for client/server errors */
export type HttpClientErrorCode =
  (typeof HTTP_CLIENT_ERROR)[keyof typeof HTTP_CLIENT_ERROR];
export type HttpServerErrorCode =
  (typeof HTTP_SERVER_ERROR)[keyof typeof HTTP_SERVER_ERROR];

/**
 * Standard Operation Timeout Profiles (in milliseconds)
 */
export const API_TIMEOUTS = {
  DEFAULT: 10_000,   // 10s: Standard REST queries & mutations
  UPLOAD: 120_000,   // 2m:  Single / Multi-file uploads
  IMPORT: 180_000,   // 3m:  CSV / Excel batch file ingestion & validation
  EXPORT: 300_000,   // 5m:  Heavy PDF generation, bulk CSV/Zip generation
  POLLING: 5_000,    // 5s:  Lightweight task status pings
} as const;

export type TimeoutProfile = keyof typeof API_TIMEOUTS;

