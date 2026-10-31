/**
 * Shared Apps: Application Descriptors
 */

export type AppId = "shop" | "admin" | "portal";

export interface AppDescriptor {
  id: AppId;
  label: string;
  description: string;
  basePath: string;
  icon?: string;
  requiredPermission?: string;
  isDefault?: boolean;
}
