# ZenOS PDF Engine v1

A schema-driven, headless PDF generation engine built on `@react-pdf/renderer`. The engine accepts a `PdfDefinition` JSON schema and compiles it into a printable, downloadable PDF — with zero hardcoded layouts in your feature code.

## Document Index

| Guide                                                          | Purpose                                     |
| -------------------------------------------------------------- | ------------------------------------------- |
| **[GETTING_STARTED.md](./GETTING_STARTED.md)**                 | Create your first PDF in 5 minutes          |
| **[SCHEMA_REFERENCE.md](./SCHEMA_REFERENCE.md)**               | Full `PdfNode` type catalogue with examples |
| **[MAPPER_GUIDE.md](./MAPPER_GUIDE.md)**                       | Mapping API responses to `PdfDefinition`    |
| **[ADVANCED.md](./ADVANCED.md)**                               | WASM mutex, self-healing fonts, preloading  |
| **[RULES_AND_ANTI_PATTERNS.md](./RULES_AND_ANTI_PATTERNS.md)** | What NOT to do                              |

## Architectural Layers

```
Feature Code
    │
    ▼
IPdfMapper (BasePdfMapper)        ← DTO → PdfDefinition transformation
    │
    ▼
usePdfDownload / usePdfPreview    ← Lifecycle hooks (WASM mutex, blob generation)
    │
    ▼
PdfEngine → PdfPage               ← Document + page layout contexts
    │
    ▼
PdfNodeRenderer                   ← Open/Closed registry dispatches PdfNode → primitive
    │
    ▼
PdfText / PdfTable / PdfGrid …    ← Atomic primitives (never import @react-pdf directly)
```

## Single Barrel Import

```typescript
import {
  BasePdfMapper,
  PdfDownloadButton,
  PdfFormat,
  usePdfDownload,
} from "@shared/ui/pdf";
```

> **Never** deep-import from internal paths (e.g. `@shared/ui/pdf/core/PdfEngine`). The barrel enforces encapsulation.
