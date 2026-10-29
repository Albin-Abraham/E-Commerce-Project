import type { AxiosError } from "axios";

const IDEMPOTENT_METHODS = ["get", "head", "options"];

export const retryCondition = (error: AxiosError): boolean => {
  // Do not retry aborted requests
  if (error.code === "ERR_CANCELED") return false;

  // Retry only safe methods
  const method = error.config?.method?.toLowerCase() || "";
  if (!IDEMPOTENT_METHODS.includes(method)) return false;

  // Do not retry FormData/Blob uploads (browser cannot replay)
  if (error.config?.data instanceof FormData) return false;

  const isNetworkError = !error.response;
  const status = error.response?.status;

  return isNetworkError || (typeof status === "number" && status >= 500);
};
