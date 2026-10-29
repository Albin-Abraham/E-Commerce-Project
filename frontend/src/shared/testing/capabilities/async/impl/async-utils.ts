import { waitFor as rtlWaitFor, within } from "@testing-library/react";
import type { WaitOptions, RetryOptions, PollOptions, WaitForElementOptions, AsyncActionOptions } from "../types";

export async function waitFor(
  callback: () => void | Promise<void>,
  options: WaitOptions = {}
): Promise<void> {
  const { timeout = 4000, interval = 50, message: _message } = options;
  await rtlWaitFor(callback, { timeout, interval });
}

export async function waitForAsync(
  callback: () => Promise<void>,
  options: WaitOptions = {}
): Promise<void> {
  await waitFor(callback, options);
}

export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  options: WaitOptions = {}
): Promise<void> {
  const { timeout = 4000, interval = 50, message } = options;
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const result = await condition();
    if (result) return;
    await new Promise(r => setTimeout(r, interval));
  }
  
  throw new Error(message || `Condition not met within ${timeout}ms`);
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { 
    maxAttempts = 3, 
    backoff = "exponential", 
    baseDelay = 100,
    timeout = 4000,
    interval: _interval = 50 
  } = options;
  
  const start = Date.now();
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) break;
      
      const elapsed = Date.now() - start;
      if (elapsed >= timeout) break;
      
      let delay: number;
      switch (backoff) {
        case "constant":
          delay = baseDelay;
          break;
        case "linear":
          delay = baseDelay * attempt;
          break;
        case "exponential":
          delay = baseDelay * Math.pow(2, attempt - 1);
          break;
      }
      
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  throw lastError || new Error(`Retry exhausted after ${maxAttempts} attempts`);
}

export async function poll(
  options: PollOptions
): Promise<void> {
  const { condition, timeout = 4000, interval = 100, onInterval, message } = options;
  const start = Date.now();
  let attempt = 0;
  
  while (Date.now() - start < timeout) {
    attempt++;
    const result = await condition();
    
    if (onInterval) {
      onInterval(attempt, result);
    }
    
    if (result) return;
    
    await new Promise(r => setTimeout(r, interval));
  }
  
  throw new Error(message || `Poll condition not met within ${timeout}ms after ${attempt} attempts`);
}

export async function pollUntil<T>(
  fn: () => Promise<T>,
  predicate: (value: T) => boolean,
  options: WaitOptions = {}
): Promise<T> {
  const { timeout = 4000, interval = 100, message } = options;
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const result = await fn();
    if (predicate(result)) return result;
    await new Promise(r => setTimeout(r, interval));
  }
  
  throw new Error(message || `Poll condition not met within ${timeout}ms`);
}

export async function waitForElement(
  options: WaitForElementOptions
): Promise<HTMLElement> {
  const { 
    container = document.body,
    selector,
    role,
    label,
    testId,
    text,
    timeout = 4000,
    interval = 50,
    message 
  } = options;
  
  const ctx = within(container);
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    let element: HTMLElement | null = null;
    
    if (selector) {
      element = container.querySelector(selector);
    } else if (role) {
      try {
        element = ctx.getByRole(role as any);
      } catch {}
    } else if (label) {
      try {
        element = ctx.getByLabelText(label);
      } catch {}
    } else if (testId) {
      try {
        element = ctx.getByTestId(testId);
      } catch {}
    } else if (text) {
      try {
        element = ctx.getByText(text);
      } catch {}
    }
    
    if (element) return element;
    
    await new Promise(r => setTimeout(r, interval));
  }
  
  throw new Error(message || `Element not found within ${timeout}ms`);
}

export async function waitForElementToDisappear(
  options: WaitForElementOptions
): Promise<void> {
  const { timeout = 4000, interval = 50, message, ...findOptions } = options;
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    try {
      await waitForElement({ ...findOptions, timeout: interval });
      await new Promise(r => setTimeout(r, interval));
    } catch {
      return;
    }
  }
  
  throw new Error(message || `Element did not disappear within ${timeout}ms`);
}

export async function waitForAction(
  options: AsyncActionOptions
): Promise<void> {
  const { action, expectedResult, timeout = 4000, interval = 50, message } = options;
  const start = Date.now();
  
  await action();
  
  if (expectedResult) {
    while (Date.now() - start < timeout) {
      const result = await expectedResult();
      if (result) return;
      await new Promise(r => setTimeout(r, interval));
    }
    throw new Error(message || `Action did not produce expected result within ${timeout}ms`);
  }
}

export async function waitForStateChange<T>(
  getState: () => T,
  predicate: (state: T) => boolean,
  options: WaitOptions = {}
): Promise<T> {
  const { timeout = 4000, interval = 50, message } = options;
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const state = getState();
    if (predicate(state)) return state;
    await new Promise(r => setTimeout(r, interval));
  }
  
  throw new Error(message || `State change not detected within ${timeout}ms`);
}

export async function waitForValueChange<T>(
  getValue: () => T,
  initialValue: T,
  options: WaitOptions = {}
): Promise<T> {
  return waitForStateChange(
    getValue,
    (value) => value !== initialValue,
    options
  );
}

export function createTimeoutPromise<T>(
  ms: number,
  value?: T
): Promise<T | undefined> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

export function createAbortablePromise<T>(
  promise: Promise<T>,
  abortSignal: AbortSignal
): Promise<T> {
  return new Promise((resolve, reject) => {
    const handleAbort = () => {
      reject(new Error("Aborted"));
    };
    
    abortSignal.addEventListener("abort", handleAbort, { once: true });
    
    promise.then(
      (value) => {
        abortSignal.removeEventListener("abort", handleAbort);
        resolve(value);
      },
      (error) => {
        abortSignal.removeEventListener("abort", handleAbort);
        reject(error);
      }
    );
  });
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        resolve(fn(...args));
      }, ms);
    });
  };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => Promise<ReturnType<T> | undefined> {
  let lastCall = 0;
  let pending: Promise<ReturnType<T>> | null = null;
  
  return async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
    const now = Date.now();
    const remaining = ms - (now - lastCall);
    
    if (remaining <= 0) {
      lastCall = now;
      return fn(...args);
    }
    
    if (!pending) {
      pending = new Promise(resolve => {
        setTimeout(() => {
          pending = null;
          lastCall = Date.now();
          resolve(fn(...args));
        }, remaining);
      });
    }
    
    return pending;
  };
}

export async function waitForAnimationFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

export async function waitForAnimationFrames(count: number = 1): Promise<void> {
  for (let i = 0; i < count; i++) {
    await waitForAnimationFrame();
  }
}

export async function waitForMicrotask(): Promise<void> {
  await Promise.resolve();
}

export async function waitForMacrotask(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}

export function createAsyncIterator<T>(items: T[], delay: number = 0): AsyncIterableIterator<T> {
  let index = 0;
  
  return {
    async next() {
      if (index >= items.length) {
        return { done: true, value: undefined };
      }
      
      if (delay > 0) {
        await new Promise(r => setTimeout(r, delay));
      }
      
      return { done: false, value: items[index++] };
    },
    
    [Symbol.asyncIterator]() {
      return this;
    }
  };
}