export type ToastVariant =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "loading";

export interface ToastEntry {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  timeout?: number;
}

let counter = 0;
const generateId = () => `toast-${++counter}`;

type Listener = () => void;

class ToastBus {
  private entries: ToastEntry[] = [];
  private listeners = new Set<Listener>();

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): ToastEntry[] => {
    return this.entries;
  };

  private emit() {
    this.listeners.forEach((l) => l());
  }

  show(
    title: string,
    variant: ToastVariant,
    options?: { description?: string; timeout?: number }
  ): string {
    const id = generateId();
    this.entries = [
      ...this.entries,
      {
        id,
        title,
        variant,
        description: options?.description,
        timeout: options?.timeout,
      },
    ];
    this.emit();
    return id;
  }

  dismiss(id: string) {
    const prev = this.entries;
    this.entries = prev.filter((e) => e.id !== id);
    if (this.entries.length !== prev.length) {
      this.emit();
    }
  }

  update(id: string, changes: Partial<Omit<ToastEntry, "id">>) {
    let changed = false;
    this.entries = this.entries.map((e) => {
      if (e.id !== id) return e;
      changed = true;
      return { ...e, ...changes };
    });
    if (changed) this.emit();
  }

  success(
    title: string,
    options?: { description?: string; timeout?: number }
  ): string {
    return this.show(title, "success", options);
  }

  danger(
    title: string,
    options?: { description?: string; timeout?: number }
  ): string {
    return this.show(title, "danger", options);
  }

  warning(
    title: string,
    options?: { description?: string; timeout?: number }
  ): string {
    return this.show(title, "warning", options);
  }

  info(
    title: string,
    options?: { description?: string; timeout?: number }
  ): string {
    return this.show(title, "info", options);
  }

  async promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    }
  ): Promise<T> {
    const id = this.show(options.loading, "loading");
    try {
      const resolved = typeof promise === "function" ? promise() : promise;
      const data = await resolved;
      this.entries = this.entries.map((e) =>
        e.id === id
          ? {
              ...e,
              title:
                typeof options.success === "function"
                  ? options.success(data)
                  : options.success,
              variant: "success" as const,
              timeout: 4000,
            }
          : e
      );
      this.emit();
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.entries = this.entries.map((e) =>
        e.id === id
          ? {
              ...e,
              title:
                typeof options.error === "function"
                  ? options.error(error)
                  : options.error,
              variant: "danger" as const,
              timeout: 6000,
            }
          : e
      );
      this.emit();
      throw error;
    }
  }
}

export const toastBus = new ToastBus();
