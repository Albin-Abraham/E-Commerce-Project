import { AxiosHttpClient } from "@configs/api/axios/axios.http.client";
import {
  AxiosAuthInstance,
  AxiosPublicInstance,
} from "@configs/api/axios/axios.instance";

import { BaseHTTPClientService } from "@services/http/core/http.client.service";

/**
 * HTTP Client Instances
 *
 * Provides two pre-configured HTTP clients:
 * - `public`: For unauthenticated requests
 * - `auth`: For authenticated requests (auto-injects Bearer token)
 */
export const httpClient = {
  public: new BaseHTTPClientService(new AxiosHttpClient(AxiosPublicInstance)),
  auth: new BaseHTTPClientService(new AxiosHttpClient(AxiosAuthInstance)),
} as const;
