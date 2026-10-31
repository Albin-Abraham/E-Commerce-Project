/**
 * Platform Authorization: Permission Value Object
 *
 * Validates permission tokens following standard namespaced notation:
 * 'module:resource:action' (e.g. 'shop:products:view', 'inventory:stock:adjust')
 */

export class PermissionVO {
  public readonly module: string;
  public readonly resource: string;
  public readonly action: string;
  public readonly value: string;

  constructor(permission: string) {
    if (!permission || typeof permission !== "string") {
      throw new Error(`Invalid permission string: "${permission}"`);
    }

    const parts = permission.trim().toLowerCase().split(":");
    if (parts.length < 2 || parts.length > 3) {
      throw new Error(
        `Permission must follow 'module:resource:action' format. Received: "${permission}"`
      );
    }

    this.module = parts[0];
    this.resource = parts[1];
    this.action = parts[2] ?? "*";
    this.value = parts.join(":");
  }

  public matches(target: string): boolean {
    const targetVO = new PermissionVO(target);
    if (this.module !== "*" && this.module !== targetVO.module) return false;
    if (this.resource !== "*" && this.resource !== targetVO.resource) return false;
    if (this.action !== "*" && this.action !== targetVO.action) return false;
    return true;
  }

  public toString(): string {
    return this.value;
  }
}
