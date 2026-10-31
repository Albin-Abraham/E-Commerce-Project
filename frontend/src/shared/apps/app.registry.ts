/**
 * Shared Apps: Application Registry
 */

import type { AppDescriptor, AppId } from "./app.descriptor";

export class AppRegistry {
  private apps = new Map<AppId, AppDescriptor>();
  private activeAppId: AppId = "shop";

  constructor() {
    this.register({
      id: "shop",
      label: "Storefront",
      description: "Omnichannel customer storefront, catalog & cart experience",
      basePath: "/products",
      isDefault: true,
    });

    this.register({
      id: "portal",
      label: "Customer Portal",
      description: "Self-service customer account, orders, addresses, and wishlist",
      basePath: "/account",
    });

    this.register({
      id: "admin",
      label: "Commerce ERP Admin",
      description: "Backoffice catalog, pricing, inventory & order fulfillment management",
      basePath: "/admin",
      requiredPermission: "admin:access",
    });
  }

  public register(descriptor: AppDescriptor): void {
    this.apps.set(descriptor.id, descriptor);
  }

  public getAll(): AppDescriptor[] {
    return Array.from(this.apps.values());
  }

  public get(id: AppId): AppDescriptor | undefined {
    return this.apps.get(id);
  }

  public getActiveApp(): AppDescriptor {
    return this.apps.get(this.activeAppId) ?? this.apps.get("shop")!;
  }

  public setActiveApp(id: AppId): void {
    if (this.apps.has(id)) {
      this.activeAppId = id;
    }
  }
}

export const appRegistry = new AppRegistry();
