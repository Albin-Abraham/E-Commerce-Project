/**
 * Shape of a standardized Axios error after parsing.
 */
export interface ParsedAxiosError {
  status: number;
  message: string; // User-friendly message
  details: (Record<string, unknown> | string)[]; // Always normalized to array
  method: string;
  endpoint: string;
  isNetworkError: boolean;
  timestamp: Date;
}
