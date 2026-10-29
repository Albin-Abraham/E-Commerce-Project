export interface WaitOptions {
  timeout?: number;
  interval?: number;
  message?: string;
}

export interface RetryOptions extends WaitOptions {
  maxAttempts?: number;
  backoff?: "constant" | "linear" | "exponential";
  baseDelay?: number;
}

export interface PollOptions extends WaitOptions {
  condition: () => boolean | Promise<boolean>;
  onInterval?: (attempt: number, result: boolean) => void;
}

export interface WaitForElementOptions extends WaitOptions {
  container?: HTMLElement;
  selector?: string;
  role?: string;
  label?: string;
  testId?: string;
  text?: string | RegExp;
}

export interface AsyncActionOptions extends WaitOptions {
  action: () => void | Promise<void>;
  expectedResult?: () => boolean | Promise<boolean>;
}