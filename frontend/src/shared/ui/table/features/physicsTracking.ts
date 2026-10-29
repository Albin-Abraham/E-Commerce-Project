import type { TableFeature } from "../types";

export interface PhysicsMetrics {
  width: number;
  height: number;
  estimateRowHeight: number;
}

export interface PhysicsTrackingApi {
  getMetrics: () => PhysicsMetrics;
}

export function PhysicsTrackingFeature(options?: {
  estimateRowHeight?: number;
}): TableFeature<any, PhysicsTrackingApi> {
  let observer: ResizeObserver | null = null;
  const metrics: PhysicsMetrics = {
    width: 0,
    height: 0,
    estimateRowHeight: options?.estimateRowHeight ?? 48,
  };

  const api: PhysicsTrackingApi = {
    getMetrics: () => ({ ...metrics }),
  };

  return {
    name: "physics",
    api,
    setup: ({ domRefs }) => {
      const container = domRefs.containerRef.current;
      if (!container || typeof ResizeObserver === "undefined") return;

      observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          metrics.width = entry.contentRect.width;
          metrics.height = entry.contentRect.height;
        }
      });

      observer.observe(container);
    },
    destroy: () => {
      observer?.disconnect();
      observer = null;
    },
  };
}
