import type { BehaviorDefinition } from "./behavior";
import type { ContentDefinition } from "./content";
import type { FormDefinition } from "./index";
import type { PresentationDefinition } from "./presentation";
import type { SurfaceDefinition } from "./surface";
import type { ValidationSettings } from "./validation";

// Re-exported so `application` consumers can reach the content contract without
// a second import from the sibling module.
export type { ContentDefinition } from "./content";

export interface EntityDefinition<
  TData extends Record<string, any> = Record<string, any>,
> {
  id: string;
  name: string;
  version?: string;
  content: ContentDefinition<TData>;
  behavior?: BehaviorDefinition<TData>;
  surface?: SurfaceDefinition;
  presentation?: PresentationDefinition;
  forms?: Record<string, FormDefinition<TData>>;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  description?: string;
  entities: Record<string, EntityDefinition<any>>;
  sharedValidationProfiles?: Record<string, ValidationSettings>;
  sharedPresentation?: PresentationDefinition;
}

/**
 * Global Application MetaSchema Definition
 * Top-level container for multi-module ERP / B2B SaaS applications.
 */
export interface ApplicationDefinition {
  id: string;
  name: string;
  version?: string;
  organization?: string;
  modules: Record<string, ModuleDefinition>;
  globalTheme?: PresentationDefinition;
  globalDatasources?: Record<
    string,
    { url: string; method?: string; headers?: Record<string, string> }
  >;
  globalSecurity?: {
    roles?: string[];
    permissions?: Record<string, string[]>;
  };
}
