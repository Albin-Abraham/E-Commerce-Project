/**
 * ZenOS Frontend Startup Banner using open library `figlet`.
 * Supports customizable props for text, font, subtitle, and DevTools styling.
 */
import figlet from "figlet";

export interface BannerProps {
  /** The text string to render (defaults to "ZenOS") */
  text?: string;
  /** FIGlet font name (defaults to "ANSI Shadow") */
  font?: figlet.Fonts;
  /** Descriptive tagline rendered beneath the banner */
  subtitle?: string;
  /** CSS color code for browser DevTools console output */
  color?: string;
}

const DEFAULT_SUBTITLE =
  " :: ZenOS Modular Frontend ::\n [ React 19 • Vite 7 • Tailwind v4 • HeroUI ]\n";

export function getZenOSFrontendBanner(props?: BannerProps): string {
  const text = props?.text ?? "ZenOS";
  const font = props?.font ?? "ANSI Shadow";
  const subtitle = props?.subtitle ?? DEFAULT_SUBTITLE;

  try {
    const art = figlet.textSync(text, { font });
    return `${art}\n${subtitle}`;
  } catch {
    return `=== ${text} Frontend ===\n`;
  }
}

export function printZenOSFrontendBanner(props?: BannerProps) {
  if (typeof window !== "undefined") {
    const banner = getZenOSFrontendBanner(props);
    const color = props?.color ?? "#06b6d4";
    console.log(
      `%c${banner}`,
      `color: ${color}; font-family: monospace; font-weight: bold; line-height: 1.1;`
    );
  }
}
