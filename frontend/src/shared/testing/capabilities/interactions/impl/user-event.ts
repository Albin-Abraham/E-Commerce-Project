import userEvent from "@testing-library/user-event";
import type { ClickOptions, TypeOptions, SelectOptions, HoverOptions, KeyboardOptions, UploadOptions } from "../types";

let userEventInstance: ReturnType<typeof userEvent.setup> | null = null;

export function getUserEvent(): ReturnType<typeof userEvent.setup> {
  if (!userEventInstance) {
    userEventInstance = userEvent.setup();
  }
  return userEventInstance;
}

export function resetUserEvent(): void {
  userEventInstance = null;
}

export async function click(
  element: HTMLElement,
  options: ClickOptions = {}
): Promise<void> {
  const user = getUserEvent();
  const { delay } = options;
  await user.click(element);
  if (delay) await new Promise(r => setTimeout(r, delay));
}

export async function doubleClick(
  element: HTMLElement,
  options: ClickOptions = {}
): Promise<void> {
  const user = getUserEvent();
  const { delay } = options;
  await user.dblClick(element);
  if (delay) await new Promise(r => setTimeout(r, delay));
}

export async function rightClick(
  element: HTMLElement,
  options: ClickOptions = {}
): Promise<void> {
  const user = getUserEvent();
  const { delay } = options;
  await user.pointer({ keys: "[MouseRight]", target: element });
  if (delay) await new Promise(r => setTimeout(r, delay));
}

export async function hover(
  element: HTMLElement,
  options: HoverOptions = {}
): Promise<void> {
  const user = getUserEvent();
  const { delay } = options;
  await user.hover(element);
  if (delay) await new Promise(r => setTimeout(r, delay));
}

export async function unhover(
  element: HTMLElement,
  options: HoverOptions = {}
): Promise<void> {
  const user = getUserEvent();
  const { delay } = options;
  await user.unhover(element);
  if (delay) await new Promise(r => setTimeout(r, delay));
}

export async function typeText(
  element: HTMLElement,
  text: string,
  options: TypeOptions = {}
): Promise<void> {
  const user = getUserEvent();
  const { clear = true, delay } = options;
  if (clear) {
    await user.clear(element);
  }
  await (user.type as any)(element, text, delay ? { delay } : undefined);
  if (delay) await new Promise(r => setTimeout(r, delay));
}

export async function clear(
  element: HTMLElement
): Promise<void> {
  const user = getUserEvent();
  await user.clear(element);
}

export async function selectOption(
  element: HTMLSelectElement,
  options: SelectOptions = {}
): Promise<void> {
  const user = getUserEvent();
  const { delay } = options;
  
  if (options.byValue !== undefined) {
    await user.selectOptions(element, options.byValue);
  } else if (options.byLabel !== undefined) {
    const opt = Array.from(element.options).find(o => o.text === options.byLabel || o.label === options.byLabel);
    if (opt) {
      await user.selectOptions(element, opt);
    }
  } else if (options.byIndex !== undefined) {
    const opt = element.options[options.byIndex];
    if (opt) {
      await user.selectOptions(element, opt);
    }
  }
  
  if (delay) await new Promise(r => setTimeout(r, delay));
}

export async function uploadFiles(
  element: HTMLElement,
  options: UploadOptions
): Promise<void> {
  const user = getUserEvent();
  const { delay, files } = options;
  await user.upload(element, files);
  if (delay) await new Promise(r => setTimeout(r, delay));
}

export async function keyboard(
  key: string,
  options: KeyboardOptions = {}
): Promise<void> {
  const user = getUserEvent();
  const { delay } = options;
  await user.keyboard(key);
  if (delay) await new Promise(r => setTimeout(r, delay));
}

export async function tab(options: KeyboardOptions = {}): Promise<void> {
  await keyboard("{Tab}", options);
}

export async function enter(options: KeyboardOptions = {}): Promise<void> {
  await keyboard("{Enter}", options);
}

export async function escape(options: KeyboardOptions = {}): Promise<void> {
  await keyboard("{Escape}", options);
}

export async function arrowUp(options: KeyboardOptions = {}): Promise<void> {
  await keyboard("{ArrowUp}", options);
}

export async function arrowDown(options: KeyboardOptions = {}): Promise<void> {
  await keyboard("{ArrowDown}", options);
}

export async function arrowLeft(options: KeyboardOptions = {}): Promise<void> {
  await keyboard("{ArrowLeft}", options);
}

export async function arrowRight(options: KeyboardOptions = {}): Promise<void> {
  await keyboard("{ArrowRight}", options);
}

export async function home(options: KeyboardOptions = {}): Promise<void> {
  await keyboard("{Home}", options);
}

export async function end(options: KeyboardOptions = {}): Promise<void> {
  await keyboard("{End}", options);
}

export async function pageUp(options: KeyboardOptions = {}): Promise<void> {
  await keyboard("{PageUp}", options);
}

export async function pageDown(options: KeyboardOptions = {}): Promise<void> {
  await keyboard("{PageDown}", options);
}

export async function deleteKey(options: KeyboardOptions = {}): Promise<void> {
  await keyboard("{Delete}", options);
}

export async function backspace(options: KeyboardOptions = {}): Promise<void> {
  await keyboard("{Backspace}", options);
}