import { type ToastVariant, toastBus } from "./toast-bus";

export interface ToastOptions {
  description?: string;
  timeout?: number;
}

function showToast(
  message: string,
  options: ToastOptions,
  method: "success" | "danger" | "warning" | "info" = "info"
): string {
  return toastBus[method](message, {
    description: options.description,
    timeout: options.timeout,
  });
}

export function toastSuccess(message: string, description?: string): string {
  return showToast(message, { description }, "success");
}

export function toastError(message: string, description?: string): string {
  return showToast(message, { description }, "danger");
}

export function toastWarning(message: string, description?: string): string {
  return showToast(message, { description }, "warning");
}

export function toastInfo(message: string, description?: string): string {
  return showToast(message, { description }, "info");
}

export function toastPromise<T>(
  promise: Promise<T> | (() => Promise<T>),
  options: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: Error) => string);
  }
): Promise<T> {
  return toastBus.promise(promise, options);
}

export function toastDismiss(id: string): void {
  toastBus.dismiss(id);
}

export function toastUpdate(
  id: string,
  changes: {
    title?: string;
    description?: string;
    variant?: ToastVariant;
    timeout?: number;
  }
): void {
  toastBus.update(id, changes);
}
