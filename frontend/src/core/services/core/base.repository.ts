import { ResponseFactory } from "@core/http";
import type { BaseDTO, BaseModel, PaginatedResponse } from "@core/http";
import { ModelTransformer } from "@core/utils/model.transformer";

import type { BaseHTTPClientService } from "../http/core/http.client.service";

/**
 * Base Repository Class
 *
 * Provides an orchestrated, class-based interface for interacting with APIs.
 * Automatically handles casing, metadata transformation, and error normalization.
 *
 * @template M - Domain Model Type
 * @template D - DTO Type
 */
export abstract class BaseRepository<M extends BaseModel, D extends BaseDTO> {
  /**
   * @param http - The HTTP client service instance
   * @param resourcePath - The base API path for this resource (e.g., 'products')
   */
  constructor(
    protected readonly http: BaseHTTPClientService,
    protected readonly resourcePath: string
  ) {}

  /**
   * Get a single item by ID
   */
  async getById(id: string | number): Promise<M> {
    const response = await this.http.get<D>(`${this.resourcePath}/${id}`);
    return this.mapToDomain(response.data);
  }

  /**
   * Get all items (potentially filtered)
   */
  async list(params?: Record<string, any>): Promise<M[]> {
    const response = await this.http.get<D[]>(this.resourcePath, { params });
    // Handle both direct arrays and enveloped { data: [] }
    const data = ResponseFactory.UnWrap<D[]>(response);
    return this.mapToDomainList(data);
  }

  /**
   * Create a new item
   */
  async create(data: Partial<M>): Promise<M> {
    const dto = this.mapToDTO(data as M);
    const response = await this.http.post<D>(this.resourcePath, dto);
    return this.mapToDomain(response.data);
  }

  /**
   * Update an existing item
   */
  async update(id: string | number, data: Partial<M>): Promise<M> {
    const dto = this.mapToDTO(data as M);
    const response = await this.http.patch<D>(
      `${this.resourcePath}/${id}`,
      dto
    );
    return this.mapToDomain(response.data);
  }

  /**
   * Delete an item
   */
  async delete(id: string | number): Promise<void> {
    await this.http.delete(`${this.resourcePath}/${id}`);
  }

  // --- Protected Mappers (Can be overridden) ---

  protected mapToDomain(dto: D): M {
    return ModelTransformer.toDomain<D, M>(dto);
  }

  protected mapToDomainList(dtos: D[]): M[] {
    return ModelTransformer.toDomainList<D, M>(dtos);
  }

  protected mapToDTO(model: M): D {
    return ModelTransformer.toDTO<M, D>(model);
  }

  /**
   * Specialized mapper for paginated responses
   */
  protected mapPaginated(resp: PaginatedResponse<D>): PaginatedResponse<M> {
    return {
      ...resp,
      items: this.mapToDomainList(resp.items),
    };
  }
}
