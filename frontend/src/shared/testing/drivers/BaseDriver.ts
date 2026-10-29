import { fireEvent, waitFor, within } from "@testing-library/react";
import { expect, vi } from "vitest";
import { axe } from "vitest-axe";
import "vitest-axe/extend-expect";

export abstract class BaseDriver {
  protected container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  // --- Core DOM Selection ---

  protected findByText(text: string) {
    const local = within(this.container).queryByText(text);
    if (local) return local;
    return within(document.body).getByText(text);
  }

  protected queryByText(text: string) {
    return (
      within(this.container).queryByText(text) ||
      within(document.body).queryByText(text)
    );
  }

  /**
   * Scoped querySelector, falling back to the portal-mounted body.
   */
  public query<T extends HTMLElement>(selector: string): T | null {
    return (
      (this.container.querySelector(selector) as T | null) ||
      (document.body.querySelector(selector) as T | null)
    );
  }

  /**
   * Scoped querySelectorAll, falling back to the portal-mounted body.
   */
  public queryAll<T extends HTMLElement>(selector: string): T[] {
    const local = Array.from(this.container.querySelectorAll(selector)) as T[];
    return local.length
      ? local
      : (Array.from(document.body.querySelectorAll(selector)) as T[]);
  }

  /**
   * Resolves content in Portals (rendered outside the container).
   */
  public resolvePortalContent<T extends HTMLElement>(
    selector: string
  ): T | null {
    return document.body.querySelector(selector) as T | null;
  }

  // --- Field-Specific Selection ---

  public getSurface(id: string) {
    const container = this.getWrapper(id);
    if (!container) return null;
    return (container.querySelector(".form-field-surface") ||
      container) as HTMLElement;
  }

  public getWrapper(id: string) {
    let ensemble = this.container.querySelector(`[data-field-id="${id}"]`);
    if (!ensemble) {
      ensemble = document.body.querySelector(`[data-field-id="${id}"]`);
    }
    return ensemble as HTMLElement;
  }

  /**
   * Selection by Metadata Name (The DCS/ECS Way)
   */
  public getWrapperByName(name: string) {
    let ensemble = this.container.querySelector(`[data-field-name="${name}"]`);
    if (!ensemble) {
      ensemble = document.body.querySelector(`[data-field-name="${name}"]`);
    }
    return ensemble as HTMLElement;
  }

  /**
   * Returns the inner content container of a field (if available).
   */
  public getContent(id: string) {
    const wrapper = this.getWrapper(id);
    if (!wrapper) return null;
    return (wrapper.querySelector(".form-field-inner") ||
      wrapper) as HTMLElement;
  }

  /**
   * Queries within a field's visual surface layer.
   */
  public queryInSurface<T extends HTMLElement>(
    id: string,
    selector: string
  ): T | null {
    const surface = this.getSurface(id);
    return surface ? (surface.querySelector(selector) as T | null) : null;
  }

  // --- Polymorphic Interactions ---

  /**
   * Automatically detects the field type and sets its value.
   */
  public async setFieldValue(id: string, value: any) {
    const type = await this.detectFieldType(id);

    switch (type) {
      case "radio":
        await this.waitFor(() => this.setRadioValue(id, value));
        break;
      case "select":
        await this.setSelectValue(id, value);
        break;
      case "checkbox":
        await this.waitFor(() => this.setCheckboxValue(id, value));
        break;
      default:
        await this.waitFor(() => this.setTextValue(id, value));
    }

    return this;
  }

  /**
   * Set field value using its metadata name (DCS Namespace).
   */
  public async setFieldValueByName(name: string, value: any) {
    const wrapper = this.getWrapperByName(name);
    if (!wrapper) throw new Error(`Field with name "${name}" not found`);
    const id = wrapper.getAttribute("data-field-id");
    if (!id) throw new Error(`Field "${name}" wrapper missing data-field-id`);
    return this.setFieldValue(id, value);
  }

  /**
   * Retrieves the current value for a field based on its type.
   */
  public async getFieldValue(id: string): Promise<any> {
    const type = await this.detectFieldType(id);
    const el =
      this.query<HTMLInputElement>(`#${id}`) ||
      this.resolvePortalContent<HTMLInputElement>(`#${id}`);

    switch (type) {
      case "radio": {
        const name = el?.getAttribute("name");
        const checked =
          this.query<HTMLInputElement>(`input[name="${name}"]:checked`) ||
          document.querySelector<HTMLInputElement>(
            `input[name="${name}"]:checked`
          );
        return checked?.value;
      }
      case "checkbox":
        return el?.checked;
      case "select":
        return (
          el?.getAttribute("data-value") ||
          el?.getAttribute("data-selected-value") ||
          el?.textContent?.trim()
        );
      default:
        return el?.value;
    }
  }

  /**
   * Get field value using its metadata name (DCS Namespace).
   */
  public async getFieldValueByName(name: string): Promise<any> {
    const wrapper = this.getWrapperByName(name);
    if (!wrapper) throw new Error(`Field with name "${name}" not found`);
    const id = wrapper.getAttribute("data-field-id");
    if (!id) throw new Error(`Field "${name}" wrapper missing data-field-id`);
    return this.getFieldValue(id);
  }

  /**
   * Internal helper to detect field type, with waiting for conditional fields.
   */
  private async detectFieldType(
    id: string
  ): Promise<"radio" | "select" | "checkbox" | "text"> {
    let el: HTMLElement | null = null;

    await this.waitFor(() => {
      el = this.query(`#${id}`) || this.resolvePortalContent(`#${id}`);
      if (!el)
        throw new Error(
          `Field #${id} not found for type detection (waiting...)`
        );
    });

    if (!el) throw new Error(`Field #${id} not found for type detection`);

    const element = el as HTMLElement;

    if (element.getAttribute("role") === "combobox") return "select";
    if (element.getAttribute("type") === "checkbox") return "checkbox";

    // Check for radio group by name
    const name = element.getAttribute("name");
    if (
      name &&
      (this.query(`input[name="${name}"][type="radio"]`) ||
        document.querySelector(`input[name="${name}"][type="radio"]`))
    )
      return "radio";

    return "text";
  }

  private setTextValue(id: string, value: any) {
    const input = this.query<HTMLInputElement>(`#${id}`);
    if (!input) throw new Error(`Input #${id} not found`);
    fireEvent.change(input, { target: { value } });
    fireEvent.blur(input);
  }

  private setRadioValue(id: string, value: any) {
    // Find radio by name and value
    const el = this.query<HTMLInputElement>(`#${id}`);
    const name = el?.getAttribute("name");
    const radio = this.query<HTMLInputElement>(
      `input[name="${name}"][value="${value}"]`
    );
    if (!radio)
      throw new Error(`Radio option "${value}" for field "${id}" not found`);
    fireEvent.click(radio);
  }

  private setCheckboxValue(id: string, value: boolean) {
    const checkbox = this.query<HTMLInputElement>(`#${id}`);
    if (!checkbox) throw new Error(`Checkbox #${id} not found`);
    if (checkbox.checked !== value) {
      fireEvent.click(checkbox);
    }
  }

  private async setSelectValue(id: string, value: any) {
    const trigger = this.query(`#${id}`);
    if (!trigger) throw new Error(`Select trigger #${id} not found`);

    // 1. Open Menu
    fireEvent.click(trigger);

    // 2. Wait for Menu to open and Find option in portal
    await this.waitFor(async () => {
      const options = Array.from(
        document.querySelectorAll('[role="option"], [data-value]')
      );
      const target = options.find((opt) => {
        const text = opt.textContent?.trim();
        const dataValue = opt.getAttribute("data-value");
        return text === String(value) || dataValue === String(value);
      });

      if (!target) {
        const found = options
          .map(
            (o) =>
              `[${o.getAttribute("data-value") || "?"}] "${o.textContent?.trim()}"`
          )
          .join(", ");
        throw new Error(
          `Select option "${value}" not found in portal for field #${id}. Found options: ${found || "none"}`
        );
      }

      fireEvent.click(target);
    });

    // 3. Wait for Menu to close (optional but safer for consecutive selects)
    await this.waitFor(() => {
      const options = Array.from(
        document.querySelectorAll('[role="option"], [data-value]')
      );
      const stillOpen = options.some((opt) => {
        const dataValue = opt.getAttribute("data-value");
        return dataValue === String(value);
      });
      if (stillOpen)
        throw new Error(`Select menu for #${id} still open after selection`);
    }, 2000).catch(() => {
      // Graceful bypass
    });
  }

  // --- BOM Manipulation ---

  public mockAlert() {
    return vi.spyOn(window, "alert").mockImplementation(() => {});
  }

  public mockConfirm(result: boolean) {
    return vi.spyOn(window, "confirm").mockImplementation(() => result);
  }

  public mockNavigation() {
    return vi.spyOn(window, "location", "set").mockImplementation(() => {});
  }

  /**
   * Storage Power Tool
   */
  public get storage() {
    return {
      set: (key: string, val: any) =>
        localStorage.setItem(key, JSON.stringify(val)),
      get: (key: string) => JSON.parse(localStorage.getItem(key) || "null"),
      expectValue: (key: string, val: any) =>
        expect(JSON.parse(localStorage.getItem(key) || "null")).toEqual(val),
      clear: () => localStorage.clear(),
    };
  }

  // --- Assertions & Async ---

  public async expectAtomicStyle(
    id: string,
    classNamePart: string,
    target: "input" | "surface" = "surface"
  ) {
    const input = this.query(`#${id}`);
    if (!input) throw new Error(`Input #${id} not found`);

    if (target === "input") {
      expect(input.className).toContain(classNamePart);
    } else {
      const surface = this.getSurface(id);
      if (!surface) throw new Error(`Surface for field #${id} not found`);
      expect(surface.className).toContain(classNamePart);
    }
  }

  public async waitFor(callback: () => void | Promise<void>, optionsOrTimeout: number | { timeout?: number } = 4000) {
    const timeout = typeof optionsOrTimeout === "number" ? optionsOrTimeout : optionsOrTimeout.timeout;
    await waitFor(callback, { timeout });
  }

  public async waitForField(id: string) {
    await this.waitFor(() => {
      const wrapper = this.getWrapper(id);
      if (!wrapper)
        throw new Error(`Field ensemble for ${id} not found in DOM`);
    }, 2000);

    await this.waitFor(() => {
      const surface = this.getSurface(id);
      if (!surface) throw new Error(`Field ${id} surface not found yet`);

      const pulse =
        surface.querySelector(".animate-pulse") ||
        this.getWrapper(id)?.querySelector(".animate-pulse");
      if (pulse) throw new Error(`Field ${id} is still loading`);
    }, 3000);
  }

  public async waitForFieldName(name: string) {
    await this.waitFor(() => {
      const wrapper = this.getWrapperByName(name);
      if (!wrapper) throw new Error(`Field "${name}" not found in DOM`);

      // Check for skeletons (React.lazy placeholders)
      const pulse = wrapper.querySelector(".animate-pulse");
      if (pulse)
        throw new Error(`Field "${name}" is still loading (skeleton active)`);
    }, 3000);
  }

  /**
   * Checks if a button with specific text exists in the container or portal.
   */
  public hasButton(text: string | RegExp): boolean {
    const buttons = Array.from(
      this.container.querySelectorAll("button")
    ) as HTMLButtonElement[];
    return buttons.some((btn) => {
      const content = btn.textContent?.trim() || "";
      return typeof text === "string"
        ? content.includes(text)
        : text.test(content);
    }) || Array.from(document.querySelectorAll("button")).some((btn) => {
      const content = btn.textContent?.trim() || "";
      return typeof text === "string"
        ? content.includes(text)
        : text.test(content);
    });
  }

  /**
   * In-process accessibility audit on the driver's container using axe-core.
   * Runs inside Vitest (jsdom) without needing to spin up a browser.
   */
  public async expectAccessible(options?: Parameters<typeof axe>[1]): Promise<void> {
    const results = await axe(this.container, options);
    try {
      expect(results).toHaveNoViolations();
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid Chai property")) {
        // Matcher not registered yet, fall back to manual check
        if (results.violations && results.violations.length > 0) {
          const messages = results.violations.map(v => `${v.id}: ${v.description}`).join("\n");
          throw new Error(`Accessibility violations found:\n${messages}`);
        }
      } else {
        throw error;
      }
    }
  }
}
