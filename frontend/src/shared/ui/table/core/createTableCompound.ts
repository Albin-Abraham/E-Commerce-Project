import React from "react";

/**
 * createTableCompound
 *
 * Factory to safely construct compound components in TypeScript without mutating
 * the original function component's prototype, which plays nicely with forwardRef.
 */
export function createTableCompound<
  R extends React.ComponentType<any>,
  C extends Record<string, unknown>,
>(Root: R, components: C): R & C {
  if (process.env.NODE_ENV === "development") {
    for (const key of Object.keys(components)) {
      if (key in Root) {
        console.warn(
          `[createTableCompound] "${key}" overwrites existing property on Root`
        );
      }
    }
  }
  return Object.assign(Root, components);
}
