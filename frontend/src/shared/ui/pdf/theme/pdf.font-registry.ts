/**
 * PdfFontRegistry
 *
 * SOLID — Single Responsibility: registers and tracks loaded PDF fonts.
 * GoF   — Flyweight / Registry: tracks registered font names to avoid duplicates.
 */
import { Font } from "@react-pdf/renderer";

/**
 * Mirrors the `FontStyle` / `FontWeight` unions declared by `@react-pdf/font`.
 * Inlined rather than imported because that package is a transitive dependency
 * of `@react-pdf/renderer` and is not resolvable directly.
 */
export type PdfFontStyle = "normal" | "italic" | "oblique";

export type PdfFontWeight =
  | number
  | "thin"
  | "hairline"
  | "ultralight"
  | "extralight"
  | "light"
  | "normal"
  | "medium"
  | "semibold"
  | "demibold"
  | "bold"
  | "ultrabold"
  | "extrabold"
  | "heavy"
  | "black";

export interface PdfFontSource {
  src: string;
  /** Named weights or a numeric weight, as accepted by @react-pdf. */
  fontWeight?: PdfFontWeight;
  fontStyle?: PdfFontStyle;
}

export class PdfFontRegistry {
  static #registered = new Set<string>();

  /**
   * Registers a custom font family with @react-pdf/renderer asynchronously.
   * Enforces idempotence to prevent duplicate registration errors.
   */
  static register(family: string, sources: PdfFontSource[]): void {
    if (this.#registered.has(family)) return;

    Font.register({
      family,
      fonts: sources,
    });

    this.#registered.add(family);
  }

  /**
   * Returns whether a font family is already registered.
   */
  static isRegistered(family: string): boolean {
    return this.#registered.has(family);
  }

  /**
   * Pre-registers standard fonts that should be available by default.
   * Can be called during app initialization or in usePdfPreload.
   */
  static registerDefaults(): void {
    // Inter is the ZenOS brand font. Since we want premium aesthetics,
    // we fetch them from trusted public URLs if they are not local.
    this.register("Inter", [
      {
        src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZg.woff2",
        fontWeight: 400,
      },
      {
        src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fMZg.woff2",
        fontWeight: 700,
      },
    ]);
  }
}
export default PdfFontRegistry;
