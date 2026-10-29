import { PRESET_CONFIGS } from "../core/TableLayoutContext";
import type { TableSurfaceLayoutConfig, ZenithTablePreset } from "../types/layout";

export { PRESET_CONFIGS };

export function resolvePresetLayout(
  preset?: ZenithTablePreset,
  customLayout?: TableSurfaceLayoutConfig
): TableSurfaceLayoutConfig {
  const base = preset ? PRESET_CONFIGS[preset] : {};
  return {
    ...base,
    ...customLayout,
    toolbar: { ...base.toolbar, ...customLayout?.toolbar },
    search: { ...base.search, ...customLayout?.search },
    filters: { ...base.filters, ...customLayout?.filters },
    pagination: { ...base.pagination, ...customLayout?.pagination },
  };
}
