import { type Page, expect } from "@playwright/test";

export interface ScreenshotOptions {
  fullPage?: boolean;
  animations?: "disabled" | "allow";
  maxDiffPixels?: number;
  threshold?: number;
  mask?: string[];
  maskColor?: string;
}

export class VisualRegression {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Takes a screenshot and compares it with the baseline.
   * On first run, creates the baseline. On subsequent runs, compares.
   * Use `--update-snapshots` flag to update baselines.
   */
  async expectMatch(name: string, options: ScreenshotOptions = {}): Promise<void> {
    const {
      fullPage = true,
      animations = "disabled",
      maxDiffPixels = 100,
      threshold = 0.2,
      mask = [],
      maskColor = "red",
    } = options;

    await expect(this.page).toHaveScreenshot(`${name}.png`, {
      fullPage,
      animations,
      maxDiffPixels,
      threshold,
      mask: mask.map((selector) => this.page.locator(selector)),
      maskColor,
    });
  }

  /**
   * Takes a screenshot of a specific element.
   */
  async expectElementMatch(
    selector: string,
    name: string,
    options: ScreenshotOptions = {}
  ): Promise<void> {
    const element = this.page.locator(selector);
    await expect(element).toHaveScreenshot(`${name}.png`, {
      animations: options.animations ?? "disabled",
      maxDiffPixels: options.maxDiffPixels ?? 50,
      threshold: options.threshold ?? 0.2,
    });
  }

  /**
   * Masks dynamic content (timestamps, user IDs, etc.) before screenshot.
   */
  async maskDynamicContent(selectors: string[]): Promise<void> {
    for (const selector of selectors) {
      await this.page.locator(selector).evaluate((el) => {
        el.style.setProperty("visibility", "hidden", "important");
      });
    }
  }

  /**
   * Waits for animations to complete and UI to stabilize.
   */
  async waitForStable(timeout = 2000): Promise<void> {
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(timeout);
    await this.page.evaluate(() => {
      return new Promise((resolve) => {
        requestAnimationFrame(() => resolve(void 0));
      });
    });
  }

  /**
   * Disables CSS animations and transitions for consistent screenshots.
   */
  async disableAnimations(): Promise<void> {
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          caret-color: transparent !important;
        }
      `,
    });
  }
}

export function createVisualRegression(page: Page): VisualRegression {
  return new VisualRegression(page);
}