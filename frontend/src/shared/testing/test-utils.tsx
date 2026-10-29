import type { ComponentType, PropsWithChildren, ReactElement } from "react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import type { InitialEntry } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { QueryClientConfig } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import { FormThemeProvider } from "@ui/form/context/FormThemeContext";
import { DEFAULT_FORM_THEME, type FormTheme } from "@ui/form/styles/FormTheme";

export interface RenderContext {
  /** Initial location for the memory router. Preserved for existing callers. */
  route?: string;
  /** Router settings for tests that need multiple locations or a basename. */
  routerOptions?: {
    initialEntries?: InitialEntry[];
    initialIndex?: number;
    basename?: string;
  };
  /** Query defaults for this render; each render still receives its own client. */
  queryClientOptions?: QueryClientConfig;
  /** Overrides merged over the application's default form theme. */
  themeProps?: Partial<FormTheme>;
  /** Additional test-specific provider, mounted inside the standard providers. */
  providers?: ComponentType<PropsWithChildren>;
}

/** Render with isolated router and query state plus the application's form theme. */
export const renderWithProviders = (
  ui: ReactElement,
  ctx: RenderContext = {},
  options?: Omit<RenderOptions, "wrapper">
) => {
  const queryClient = new QueryClient({
    ...ctx.queryClientOptions,
    defaultOptions: {
      ...ctx.queryClientOptions?.defaultOptions,
      queries: {
        retry: false,
        ...ctx.queryClientOptions?.defaultOptions?.queries,
      },
    },
  });
  const router = createMemoryRouter([{ path: "*", element: ui }], {
    initialEntries: ctx.routerOptions?.initialEntries ?? [ctx.route ?? "/"],
    initialIndex: ctx.routerOptions?.initialIndex,
    basename: ctx.routerOptions?.basename,
  });
  const AdditionalProviders = ctx.providers;

  const rendered = (
    <QueryClientProvider client={queryClient}>
      <FormThemeProvider
        theme={
          ctx.themeProps
            ? { ...DEFAULT_FORM_THEME, ...ctx.themeProps }
            : DEFAULT_FORM_THEME
        }
      >
        {AdditionalProviders ? (
          <AdditionalProviders>
            <RouterProvider router={router} />
          </AdditionalProviders>
        ) : (
          <RouterProvider router={router} />
        )}
      </FormThemeProvider>
    </QueryClientProvider>
  );

  const result = render(rendered, options);
  return { ...result, queryClient, router };
};
