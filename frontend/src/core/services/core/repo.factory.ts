import type { HttpClient, HttpRequestConfig } from "@core/http";

/**
 * Endpoint Metadata Definition
 *
 * Captures the static configuration of an API endpoint including:
 * - URL (can be a template or function)
 * - Method
 * - Transform options (casing, enveoping)
 */
export interface Endpoint<TReq = any, _TRes = any> {
  path: string | ((args: TReq) => string);
  method: HttpRequestConfig["method"];
  config?: Partial<Omit<HttpRequestConfig, "url" | "method" | "data">>;
}

/**
 * defineEndpoint: Helper for type-safe endpoint definitions
 */
export function defineEndpoint<TReq = any, TRes = any>(
  definition: Endpoint<TReq, TRes>
): Endpoint<TReq, TRes> {
  return definition;
}

/**
 * Repository Implementation
 *
 * Maps an EndpointSchema to a set of executable functions.
 */
export type Repository<TSchema extends Record<string, Endpoint>> = {
  [K in keyof TSchema]: TSchema[K] extends Endpoint<infer TReq, infer TRes>
    ? (data: TReq, overrideConfig?: Partial<HttpRequestConfig>) => Promise<TRes>
    : never;
};

/**
 * createRepository: The Functional Factory
 *
 * Binds a set of endpoints to an HttpClient instance.
 * Automatically handles path interpolation and data passing.
 */
export function createRepository<TSchema extends Record<string, Endpoint>>(
  client: HttpClient,
  schema: TSchema
): Repository<TSchema> {
  const repo = {} as any;

  for (const key in schema) {
    const endpoint = schema[key];

    repo[key] = async (
      data: any,
      overrideConfig?: Partial<HttpRequestConfig>
    ) => {
      const url =
        typeof endpoint.path === "function"
          ? endpoint.path(data)
          : endpoint.path;

      // For GET/DELETE, data should typically go to params unless specified
      const isBodyMethod = ["POST", "PUT", "PATCH"].includes(endpoint.method);

      const response = await client.request<any>({
        url,
        method: endpoint.method,
        ...(isBodyMethod ? { data } : { params: data }),
        ...endpoint.config,
        ...overrideConfig,
      });

      // Automated data extraction (assumes BaseHTTPClientService handles UnWrap)
      return response.data;
    };
  }

  return repo as Repository<TSchema>;
}
