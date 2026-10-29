export * from "./lifecycle";
export * from "./state-manager";
export * from "./network-reset";

import type { IsolationPolicy, TestContext, IsolationLevel, IsolationHook } from "./lifecycle";
import * as lifecycle from "./lifecycle";
import * as stateManager from "./state-manager";
import * as networkReset from "./network-reset";

export function createIsolationCapability() {
  return {
    // Policy
    defaultIsolationPolicy: lifecycle.defaultIsolationPolicy,
    createIsolationPolicy: lifecycle.createIsolationPolicy,
    
    // Context
    createTestContext: lifecycle.createTestContext,
    runIsolationHooks: lifecycle.runIsolationHooks,
    addCleanupFn: lifecycle.addCleanupFn,
    runCleanupFns: lifecycle.runCleanupFns,
    shareResource: lifecycle.shareResource,
    getSharedResource: lifecycle.getSharedResource,
    hasSharedResource: lifecycle.hasSharedResource,
    removeSharedResource: lifecycle.removeSharedResource,
    clearSharedResources: lifecycle.clearSharedResources,
    
    // State Management
    initializeStateManager: stateManager.initializeStateManager,
    getGlobalStateManager: stateManager.getGlobalStateManager,
    createTestStateManager: stateManager.createTestStateManager,
    getState: stateManager.getState,
    setState: stateManager.setState,
    deleteState: stateManager.deleteState,
    clearAllState: stateManager.clearAllState,
    setupTestIsolation: stateManager.setupTestIsolation,
    teardownTestIsolation: stateManager.teardownTestIsolation,
    createIsolatedStore: stateManager.createIsolatedStore,
    
    // Network
    setupNetworkIsolation: networkReset.setupNetworkIsolation,
    teardownNetworkIsolation: networkReset.teardownNetworkIsolation,
    resetNetworkHandlers: networkReset.resetNetworkHandlers,
    addRequestInterceptor: networkReset.addRequestInterceptor,
    removeRequestInterceptor: networkReset.removeRequestInterceptor,
    addResponseInterceptor: networkReset.addResponseInterceptor,
    removeResponseInterceptor: networkReset.removeResponseInterceptor,
    mockFetch: networkReset.mockFetch,
    unmockFetch: networkReset.unmockFetch,
    clearFetchMocks: networkReset.clearFetchMocks,
    getFetchMocks: networkReset.getFetchMocks,
    setupMSWIsolation: networkReset.setupMSWIsolation,
    teardownMSWIsolation: networkReset.teardownMSWIsolation,
    resetMSWHandlers: networkReset.resetMSWHandlers,
    useMSWHandler: networkReset.useMSWHandler,
    restoreMSWHandlers: networkReset.restoreMSWHandlers,
    setupTestNetworkIsolation: networkReset.setupTestNetworkIsolation,
    teardownTestNetworkIsolation: networkReset.teardownTestNetworkIsolation,
    createNetworkRecorder: networkReset.createNetworkRecorder,
    createMockServer: networkReset.createMockServer,
  };
}

export type IsolationCapability = ReturnType<typeof createIsolationCapability>;