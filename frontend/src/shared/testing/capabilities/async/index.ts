export * from "./types";
export * from "./impl/async-utils";
export * from "./impl/polling";

import type { WaitOptions, RetryOptions, PollOptions, WaitForElementOptions, AsyncActionOptions } from "./types";
import * as asyncUtils from "./impl/async-utils";
import * as polling from "./impl/polling";

export function createAsyncCapability(_container?: HTMLElement) {
  return {
    // Core Async
    waitFor: (callback: () => void | Promise<void>, options?: WaitOptions) =>
      asyncUtils.waitFor(callback, options),
    waitForAsync: (callback: () => Promise<void>, options?: WaitOptions) =>
      asyncUtils.waitForAsync(callback, options),
    waitForCondition: (condition: () => boolean | Promise<boolean>, options?: WaitOptions) =>
      asyncUtils.waitForCondition(condition, options),
    retry: <T>(fn: () => Promise<T>, options?: RetryOptions) =>
      asyncUtils.retry(fn, options),
    poll: (options: PollOptions) =>
      asyncUtils.poll(options),
    pollUntil: <T>(fn: () => Promise<T>, predicate: (value: T) => boolean, options?: WaitOptions) =>
      asyncUtils.pollUntil(fn, predicate, options),
    waitForElement: (options: WaitForElementOptions) =>
      asyncUtils.waitForElement(options),
    waitForElementToDisappear: (options: WaitForElementOptions) =>
      asyncUtils.waitForElementToDisappear(options),
    waitForAction: (options: AsyncActionOptions) =>
      asyncUtils.waitForAction(options),
    waitForStateChange: <T>(getState: () => T, predicate: (state: T) => boolean, options?: WaitOptions) =>
      asyncUtils.waitForStateChange(getState, predicate, options),
    waitForValueChange: <T>(getValue: () => T, initialValue: T, options?: WaitOptions) =>
      asyncUtils.waitForValueChange(getValue, initialValue, options),
    createTimeoutPromise: <T>(ms: number, value?: T) =>
      asyncUtils.createTimeoutPromise(ms, value),
    createAbortablePromise: <T>(promise: Promise<T>, abortSignal: AbortSignal) =>
      asyncUtils.createAbortablePromise(promise, abortSignal),
    debounce: <T extends (...args: any[]) => any>(fn: T, ms: number) =>
      asyncUtils.debounce(fn, ms),
    throttle: <T extends (...args: any[]) => any>(fn: T, ms: number) =>
      asyncUtils.throttle(fn, ms),
    waitForAnimationFrame: () =>
      asyncUtils.waitForAnimationFrame(),
    waitForAnimationFrames: (count?: number) =>
      asyncUtils.waitForAnimationFrames(count),
    waitForMicrotask: () =>
      asyncUtils.waitForMicrotask(),
    waitForMacrotask: () =>
      asyncUtils.waitForMacrotask(),
    createAsyncIterator: <T>(items: T[], delay?: number) =>
      asyncUtils.createAsyncIterator(items, delay),
    
    // Polling
    pollForResource: (options: any) =>
      polling.pollForResource(options),
    pollForListItem: (options: any) =>
      polling.pollForListItem(options),
    pollForCount: (options: any) =>
      polling.pollForCount(options),
    pollUntilExists: <T>(getItems: () => Promise<T[]>, filter: (item: T) => boolean, options?: WaitOptions) =>
      polling.pollUntilExists(getItems, filter, options),
    pollUntilGone: <T>(getItems: () => Promise<T[]>, filter: (item: T) => boolean, options?: WaitOptions) =>
      polling.pollUntilGone(getItems, filter, options),
    pollForCondition: (condition: () => Promise<boolean>, options?: WaitOptions) =>
      polling.pollForCondition(condition, options),
    waitForApiResponse: <T>(fetchFn: () => Promise<T>, predicate: (response: T) => boolean, options?: WaitOptions) =>
      polling.waitForApiResponse(fetchFn, predicate, options),
    waitForWebSocketMessage: <T>(ws: WebSocket, predicate: (message: T) => boolean, options?: WaitOptions) =>
      polling.waitForWebSocketMessage(ws, predicate, options),
    waitForEvent: <E>(emitter: EventTarget, eventType: string, predicate: (event: E) => boolean, options?: WaitOptions) =>
      polling.waitForEvent(emitter, eventType, predicate, options),
    waitForCustomEvent: <T>(eventName: string, predicate: (detail: T) => boolean, options?: WaitOptions) =>
      polling.waitForCustomEvent(eventName, predicate, options),
    createPollingSubscription: <T>(fetchFn: () => Promise<T>, interval?: number) =>
      polling.createPollingSubscription(fetchFn, interval),
  };
}

export type AsyncCapability = ReturnType<typeof createAsyncCapability>;