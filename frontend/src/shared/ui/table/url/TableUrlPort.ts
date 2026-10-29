import type { PlatformUrlPort } from "@core/router/ports/PlatformUrlPort";

/**
 * TableUrlPort — Abstract URL adapter interface for ZenithTable.
 *
 * Clean Architecture (Port & Adapters):
 * Form and Table architectures are unified through PlatformUrlPort.
 * The table depends on this interface, never on react-router directly.
 * Enables: ReactRouter, Next.js, native window, or in-memory mock adapters.
 */
export interface TableUrlPort extends PlatformUrlPort {}
