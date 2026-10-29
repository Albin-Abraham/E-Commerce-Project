# Advanced Topics: WASM, Self-Healing Fonts & Performance

## 1. The WASM Compile Mutex

`@react-pdf/renderer` uses a WASM-based layout engine. Running two PDF compilations simultaneously causes WASM thread collisions and CPU spikes.

The `usePdf` hooks internally manage a **module-level mutex** (`globalCompilePromise`). If a second PDF generation is triggered while one is in progress, it queues and waits for the first to complete before starting.

This means: **never manage your own concurrency guard** — it is already handled.

```typescript
// ✅ Safe — second call auto-queues behind the first
const { downloadFromDefinition } = usePdfDownload();
downloadFromDefinition(def1); // starts immediately
downloadFromDefinition(def2); // queues automatically
```

---

## 2. Self-Healing Font Fallback

If custom fonts fail to load (e.g. corporate intranet with no CDN access), the engine automatically retries using the built-in `Helvetica` system font instead of throwing an error:

```
First attempt:  PdfFontRegistry.registerDefaults() → custom fonts
    ↓ (fails — remote font URL not reachable)
Retry:          Fallback theme with Helvetica / Courier
    ↓
PDF generated  (degraded visual, but no crash)
```

The console will log: `"PDF render failed. Retrying with built-in Helvetica..."`.

No action is required from consumers — the healing is fully automatic.

---

## 3. Cold-Start Warming with `usePdfPreload`

The WASM engine has a 1–3 second initialization delay on first use. `usePdfPreload` eliminates this by warming the engine during browser idle time:

```tsx
import { usePdfPreload } from "@shared/ui/pdf";

// Mount once in your top-level dashboard layout shell
export function DashboardShell({ children }) {
  usePdfPreload(); // fires during requestIdleCallback — zero UX impact

  return <main>{children}</main>;
}
```

**What it does internally:**

1. Calls `PdfFontRegistry.registerDefaults()` immediately
2. Generates a tiny invisible dummy PDF during `requestIdleCallback` (or a 2s `setTimeout` if the API is unavailable)
3. Sets a module-level `isWasmWarmedUp` flag so subsequent mounts skip the warmup

---

## 4. `usePdfPreview` — In-Browser Preview

Instead of triggering a download, `usePdfPreview` generates a blob `objectUrl` you can mount in an `<iframe>` or `<embed>` for live preview:

```tsx
import { usePdfPreview } from "@shared/ui/pdf";

export function PdfPreviewPanel({ definition }) {
  const { generate, objectUrl, isGenerating, clear } = usePdfPreview();

  useEffect(() => {
    generate(definition);
    return clear; // Revokes the objectUrl on unmount — prevents memory leaks
  }, [definition]);

  if (isGenerating) return <div>Generating preview...</div>;
  if (!objectUrl) return null;

  return (
    <iframe
      src={objectUrl}
      className="w-full h-[800px] border rounded-xl"
      title="PDF Preview"
    />
  );
}
```

> **Memory safety**: Always call `clear()` on unmount. The hook revokes the `objectUrl` on each `generate()` call automatically, but the final URL must be cleaned up by the component.

---

## 5. Registering Custom Node Types (`registerPdfNodeRenderer`)

The `PdfNodeRenderer` uses an Open/Closed registry. You can extend it with custom node types without modifying the engine:

```tsx
import { Text, View } from "@react-pdf/renderer";

import { registerPdfNodeRenderer } from "@shared/ui/pdf";

// Register a custom "watermark" node type
registerPdfNodeRenderer("watermark", (node: any) => (
  <View
    fixed
    style={{
      position: "absolute",
      top: "45%",
      left: "20%",
      opacity: 0.08,
      transform: "rotate(-35deg)",
    }}
  >
    <Text style={{ fontSize: 72, fontWeight: "bold", color: "#000" }}>
      {node.text ?? "CONFIDENTIAL"}
    </Text>
  </View>
));

// Now use in any PdfDefinition:
const node = { type: "watermark", text: "DRAFT" };
```

> Register custom renderers once at the application entry point (`main.tsx`) or in a shared `pdf.setup.ts` module.
