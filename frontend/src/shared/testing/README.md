# Driver-Based Test System

This directory contains the infrastructure for the application's driver-based testing architecture.

## Architecture Overview

| Directory          | Purpose                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `drivers/`         | Contains focused component and workflow drivers for repeated operations. |
| `rules/`           | Contains reusable business logic assertions (e.g., `mustRequireName`).                                     |
| `helpers/`         | specialized mechanical helpers (if any).                                                                   |
| `types/`           | Shared types like `FailureType`.                                                                           |
| `types/failure.ts` | Defines the `FailureType` enum for classifying errors.                                                     |

## Core Principles

1.  **Vitest Orchestrates**: Test lifecycle and suite setup use Vitest hooks.
2.  **Use semantic queries**: Prefer role, label, and text queries that reflect what a user sees.
3.  **Use drivers where they help**: Keep simple interactions in the test; extract repeated or domain-specific workflows into focused drivers.
4.  **Isolate mutable state**: Each shared render gets a fresh router and QueryClient; MSW scenario handlers reset after each test.

## Example Usage

```typescript
import { CreateBranchDriver } from "./drivers/CreateBranchDriver";

it("creates a new branch", async () => {
  const { driver } = await CreateBranchDriver.render();

  await driver.enterBranchName("Web Branch");
  await driver.createBranch();

  await driver.expectSuccess();
});
```

See `src/shared/testing/__tests__/CreateBranch.test.tsx` for a running example.

`renderWithProviders` accepts a `RenderContext` for the initial route, router
settings, query defaults, theme overrides, and an optional additional provider.
It returns the Testing Library render result together with the isolated
`queryClient` and memory `router`. `renderWithForm` builds on the same shared
providers while adding the live form registry context.

MSW starts for the Vitest suite with unhandled requests treated as errors.
Use `server.use(...)` for scenario-specific handlers; the shared setup resets
those overrides after each test.
