export interface InteractionOptions {
  container?: HTMLElement;
  delay?: number;
  skipHover?: boolean;
}

export interface ClickOptions extends InteractionOptions {
  button?: 0 | 1 | 2;
  modifiers?: ("Alt" | "Control" | "Shift" | "Meta")[];
  position?: { x: number; y: number };
}

export interface TypeOptions extends InteractionOptions {
  clear?: boolean;
  delay?: number;
}

export interface SelectOptions extends InteractionOptions {
  byValue?: string;
  byLabel?: string;
  byIndex?: number;
}

export interface HoverOptions extends InteractionOptions {
  position?: { x: number; y: number };
}

export interface KeyboardOptions extends InteractionOptions {
  key?: string;
  modifiers?: ("Alt" | "Control" | "Shift" | "Meta")[];
}

export interface UploadOptions extends InteractionOptions {
  files: File | File[];
}

export interface DragDropOptions extends InteractionOptions {
  source: HTMLElement;
  target: HTMLElement;
}