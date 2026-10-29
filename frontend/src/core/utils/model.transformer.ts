import { HttpTransformer } from "@core/http/http.transformer";

import type { BaseDTO, BaseModel } from "../http/http.dto.types";

/**
 * Model Transformer Utility
 *
 * Provides pure functions for transforming between DTOs and Domain Models.
 * Handles meta-field mapping (snake_case -> camelCase) and recursive casing.
 */
export const ModelTransformer = {
  /**
   * Transforms a single DTO to a Domain Model
   *
   * @template D - DTO Type
   * @template M - Model Type
   * @param dto - Source DTO
   * @returns Transformed Domain Model
   */
  toDomain<D extends BaseDTO, M extends BaseModel>(dto: D): M {
    if (!dto) return dto as unknown as M;

    // 1. Recursive camelCase transformation
    const camelized = HttpTransformer.toCamelCase<M>(dto);

    // 2. Explicit meta-field mapping (ensure they are always set correctly)
    const model = {
      ...camelized,
      id: dto.id,
      createdAt: dto.created_at || (camelized as any).createdAt,
      updatedAt: dto.updated_at || (camelized as any).updatedAt,
      createdBy: dto.created_by || (camelized as any).createdBy,
      updatedBy: dto.updated_by || (camelized as any).updatedBy,
    } as M;

    return model;
  },

  /**
   * Transforms a list of DTOs to Domain Models
   */
  toDomainList<D extends BaseDTO, M extends BaseModel>(dtos: D[]): M[] {
    if (!Array.isArray(dtos)) return [];
    return dtos.map((dto) => this.toDomain<D, M>(dto));
  },

  /**
   * Transforms a Domain Model back to a DTO (for requests)
   */
  toDTO<M extends BaseModel, D extends BaseDTO>(model: M): D {
    if (!model) return model as unknown as D;

    // 1. Recursive snake_case transformation
    const snaked = HttpTransformer.toSnakeCase<D>(model);

    // 2. Explicit meta-field mapping
    const dto = {
      ...snaked,
      id: model.id,
      created_at: model.createdAt || (snaked as any).created_at,
      updated_at: model.updatedAt || (snaked as any).updated_at,
      created_by: model.createdBy || (snaked as any).created_by,
      updated_by: model.updatedBy || (snaked as any).updated_by,
    } as D;

    return dto;
  },
};
