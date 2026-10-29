/**
 * Legacy Icon Registry Bridge
 *
 * This file is now a thin wrapper around @shared/icons.
 * It remains here to support the Form Engine's internal utilities
 * without requiring a massive refactor of import paths.
 */

export { getIcon, ICON_MAP } from "@shared/icons";
