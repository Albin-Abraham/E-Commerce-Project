export interface SecuritySettings {
  sanitizeHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  scriptDisabled?: boolean;
  sandboxExpressions?: boolean;
  maxExpressionLength?: number;
}

export interface PerformanceSettings {
  lazyLoad?: boolean;
  virtualScroll?: boolean;
  chunkSize?: number;
  deferRendering?: boolean;
  throttleMs?: number;
  cacheResults?: boolean;
}

export interface HistorySettings {
  maxSteps?: number;
  trackChanges?: boolean;
  includeValues?: boolean;
  persistHistory?: boolean;
}
