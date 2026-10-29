/**
 * usePdfDownload — Download hook
 * usePdfPreview  — Object URL preview hook
 * usePdfPreload  — PDF Engine and Font preloader
 *
 * SOLID — Single Responsibility: download/preview/preload lifecycle logic.
 * GoF   — Command: encapsulates generation and download steps.
 *         Proxy: wraps @react-pdf pdf() with loading state.
 */
import { useCallback, useEffect, useState } from "react";

import { pdf } from "@react-pdf/renderer";

import { PdfEngine } from "../core/PdfEngine";
import type { PdfDefinition } from "../parser/pdf.schema.types";
import { PdfFontRegistry } from "../theme/pdf.font-registry";
import type { PdfTheme } from "../theme/pdf.theme";

// ── Compile Lock (Mutex Pattern) ───────────────────────────────────────────

let globalCompilePromise: Promise<any> | null = null;

// ── Shared blob generator with Self-Healing fallback ───────────────────────

async function generateBlob(
  definition: PdfDefinition,
  theme?: Partial<PdfTheme>
): Promise<Blob> {
  // Queue compilation sequentially to prevent WASM thread collisions & high CPU spike
  while (globalCompilePromise) {
    await globalCompilePromise;
  }

  let resolveMutex: () => void = () => {};
  globalCompilePromise = new Promise<void>((resolve) => {
    resolveMutex = resolve;
  });

  try {
    // 1. Try registering fonts
    PdfFontRegistry.registerDefaults();

    try {
      const element = <PdfEngine definition={definition} theme={theme} />;
      return await pdf(element).toBlob();
    } catch (err) {
      // 2. Self-Healing Fallback: If remote font loads fail (e.g. offline/intranet),
      // fallback to system Helvetica immediately so the document compiles without throwing.
      console.warn(
        "PDF render failed (possible remote font load failure). Retrying with built-in Helvetica...",
        err
      );

      const fallbackTheme: Partial<PdfTheme> = {
        ...theme,
        fonts: {
          body: "Helvetica",
          heading: "Helvetica",
          mono: "Courier",
        },
      };

      const element = (
        <PdfEngine definition={definition} theme={fallbackTheme} />
      );
      return await pdf(element).toBlob();
    }
  } finally {
    globalCompilePromise = null;
    resolveMutex();
  }
}

// ── usePdfDownload ─────────────────────────────────────────────────────────

export function usePdfDownload(theme?: Partial<PdfTheme>) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const downloadFromDefinition = useCallback(
    async (definition: PdfDefinition, filenameOverride?: string) => {
      if (isGenerating) return; // Prevent double-triggering

      setIsGenerating(true);
      setError(null);
      try {
        const blob = await generateBlob(definition, theme);
        const url = URL.createObjectURL(blob);
        const filename =
          filenameOverride ?? definition.filename ?? `${definition.id}.pdf`;
        const a = Object.assign(document.createElement("a"), {
          href: url,
          download: filename,
        });
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsGenerating(false);
      }
    },
    [theme, isGenerating]
  );

  return { downloadFromDefinition, isGenerating, error };
}

// ── usePdfPreview ──────────────────────────────────────────────────────────

export function usePdfPreview(theme?: Partial<PdfTheme>) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(
    async (definition: PdfDefinition) => {
      if (isGenerating) return; // Prevent double-triggering
      if (objectUrl) URL.revokeObjectURL(objectUrl);

      setIsGenerating(true);
      setError(null);
      try {
        const blob = await generateBlob(definition, theme);
        setObjectUrl(URL.createObjectURL(blob));
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsGenerating(false);
      }
    },
    [theme, objectUrl, isGenerating]
  );

  const clear = useCallback(() => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(null);
  }, [objectUrl]);

  return { generate, objectUrl, isGenerating, error, clear };
}

// ── usePdfPreload ──────────────────────────────────────────────────────────

let isWasmWarmedUp = false;

export function usePdfPreload() {
  useEffect(() => {
    // 1. Register fonts immediately
    PdfFontRegistry.registerDefaults();

    // 2. Cold-start warm up of @react-pdf layout engine (WASM) during idle time
    if (isWasmWarmedUp) return;

    const warmUp = async () => {
      try {
        const dummyDef: PdfDefinition = {
          id: "warmup",
          pages: [
            {
              sections: [{ nodes: [{ type: "text", value: "warmup" }] }],
            },
          ],
        };
        const element = <PdfEngine definition={dummyDef} />;
        await pdf(element).toBlob();
        isWasmWarmedUp = true;
      } catch (e) {
        // Fail silently in background
        console.warn("PDF preloader failed to warm up WASM:", e);
      }
    };

    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => {
          warmUp();
        });
      } else {
        setTimeout(warmUp, 2000);
      }
    }
  }, []);
}
