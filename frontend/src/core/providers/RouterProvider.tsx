import React from "react";
import { RouterProvider as ReactRouterProvider } from "react-router-dom";
import { Link } from "react-router-dom";

import { PlatformCommand } from "@core/events/config/shortcuts";
import { composeApplication } from "@core/router/composition/compose-application";
import { CompositionProvider } from "@core/router/composition/CompositionContext";
import { createAppRouterFromRoutes } from "@core/router/adapters/ReactRouterAdapter";
import { defineRoute } from "@core/router/route.types";
import type { AppRoute } from "@core/router/route.types";
import { moduleRegistry } from "@core/router/registries/module.registry";
import { RouterServicesProvider } from "@core/router/services/RouterServicesContext";
import { registerGlobalSlots } from "@core/slots/global-registrations";
import { registerAllFeatures } from "@features";
import { sharedPublicRoutes } from "@shell/boot/public.routes";
import RootLayout from "@shell/layouts/RootLayer";
import { AppPaths } from "@shell/paths";

// Services
import { httpClient } from "@services/http.instance";

// Feature UI Components for Declarative Injection
import { UserProfile } from "@features/auth/register";

import { Zenith } from "@shared/theme";
import { ZenosBootSplash } from "@shared/ui/ZenosBootSplash";
import { ForbiddenErrorState, NotFoundErrorState } from "@shared/ui/errors";
import { ZenithErrorElement } from "@shared/ui/common/ZenithErrorElement";

// Lazy Private Pages - kept at module level (no side effects, only factory refs)
const Home = React.lazy(() => import("@pages/static-pages/Home"));
const FormBuilderPage = React.lazy(
  () => import("@pages/static-pages/FormBuilderPage")
);
const FormDebugPage = React.lazy(
  () => import("@pages/static-pages/FormDebugPage")
);
const CreateBranch = React.lazy(
  () => import("@pages/static-pages/CreateBranch")
);
const AuthPortalPage = React.lazy(
  () => import("@pages/static-pages/AuthPortalPage")
);
const TestFormModel = React.lazy(
  () => import("@pages/static-pages/form")
);
const TestMultiStepFormModel = React.lazy(
  () => import("@pages/static-pages/multi-step-form")
);
const TableDemoPage = React.lazy(
  () => import("@pages/static-pages/TableDemoPage")
);
const CustomerProfilePage = React.lazy(
  () => import("@shell/pages/customer/CustomerProfilePage")
);
const CustomerOrdersPage = React.lazy(
  () => import("@shell/pages/customer/CustomerOrdersPage")
);
const CustomerWishlistPage = React.lazy(
  () => import("@shell/pages/customer/CustomerWishlistPage")
);

import { useTranslation } from "react-i18next";

const FooterTermsLink = () => {
  const { t } = useTranslation("layouts/navigation");
  return (
    <Link
      to="#"
      className="nav-zenith text-[10px] uppercase tracking-widest font-black opacity-60"
    >
      {t("footer.platformTerms")}
    </Link>
  );
};

const AccountProfilePage = () => {
  const { t } = useTranslation("layouts/navigation");
  return (
    <div {...Zenith.container("profile-view")}>
      <h1 className={Zenith.text("h1")}>{t("sidebar.userProfile")}</h1>
      <p className={Zenith.text("body", false)}>
        {t("sidebar.identityAccounts")}
      </p>
    </div>
  );
};

const AccountSettingsPage = () => {
  const { t } = useTranslation("layouts/navigation");
  return (
    <div {...Zenith.container("settings-view")}>
      <h1 className={Zenith.text("h1")}>{t("sidebar.securitySettings")}</h1>
      <p className={Zenith.text("body", false)}>
        {t("sidebar.identityAccounts")}
      </p>
    </div>
  );
};

// Module-level flag to ensure registries are initialized exactly once without
// throwing during module evaluation (prevents Vite "error loading dynamically
// imported module" when a registry dependency throws).
let registriesInitialized = false;
function ensureRegistries() {
  if (registriesInitialized) return;
  try {
    registerGlobalSlots();
    registerAllFeatures();
    registriesInitialized = true;
  } catch (err) {
    console.error("[RouterProvider] Failed to initialize registries:", err);
    // Don't re-throw — allow the module to load so ErrorBoundary can render
    // a recoverable UI instead of a Vite chunk load failure.
    registriesInitialized = true;
  }
}

const ROOT_ROUTE_ID = "root";

function buildBaseRoutes(): AppRoute[] {
  ensureRegistries();
  return [
    defineRoute({
      id: "showcase.auth",
      path: AppPaths.Showcase.Auth,
      page: AuthPortalPage,
    }),
    defineRoute({
      id: "workspace",
      path: AppPaths.Workspace,
      page: React.lazy(() => import("@pages/static-pages/WorkspacePage")),
    }),
    defineRoute({
      id: "login.redirect",
      path: AppPaths.Login,
      redirectTo: AppPaths.Root,
    }),
    defineRoute({
      id: "forbidden",
      path: AppPaths.Forbidden,
      page: ForbiddenErrorState,
    }),
    defineRoute({
      id: "not-found",
      path: AppPaths.NotFound,
      page: NotFoundErrorState,
    }),
    defineRoute({
      id: ROOT_ROUTE_ID,
      path: AppPaths.Root,
      layout: RootLayout,
      errorElement: <ZenithErrorElement />,
      shortcuts: [
        {
          key: ["meta+k", "ctrl+k"],
          command: PlatformCommand.FocusSearch,
          description: "Search",
        },
      ],
      slots: [
        { name: "user-profile", component: UserProfile },
        {
          name: "footer-links",
          component: FooterTermsLink,
        },
      ],
      children: [
        {
          id: "home",
          path: AppPaths.Root,
          index: true,
          page: Home,
        },
        {
          id: "builder",
          path: AppPaths.Builder,
          page: FormBuilderPage,
        },
        {
          id: "debug",
          path: AppPaths.Debug,
          page: FormDebugPage,
        },
        ...sharedPublicRoutes,
        {
          id: "account",
          path: AppPaths.Account.Root,
          children: [
            {
              id: "account.profile",
              path: AppPaths.Account.Profile.replace("/account/", ""),
              page: CustomerProfilePage,
            },
            {
              id: "account.orders",
              path: AppPaths.Account.Orders.replace("/account/", ""),
              page: CustomerOrdersPage,
            },
            {
              id: "account.wishlist",
              path: AppPaths.Account.Wishlist.replace("/account/", ""),
              page: CustomerWishlistPage,
            },
            {
              id: "account.settings",
              path: AppPaths.Account.Settings.replace("/account/", ""),
              page: AccountSettingsPage,
            },
          ],
        },
        {
          id: "showcase",
          path: AppPaths.Showcase.Root,
          label: "Showcase",
          breadcrumb: "Showcase",
          children: [
            {
              id: "showcase.employee",
              path: AppPaths.Showcase.Employee.replace(
                AppPaths.Showcase.Root + "/",
                ""
              ),
              label: "Employee Form",
              breadcrumb: "Employee Form",
              page: TestFormModel,
            },
            {
              id: "showcase.branch",
              path: AppPaths.Showcase.Branch.replace(
                AppPaths.Showcase.Root + "/",
                ""
              ),
              label: "Branch Creator",
              breadcrumb: "Branch Creator",
              page: CreateBranch,
            },
            {
              id: "showcase.wizard",
              path: AppPaths.Showcase.Wizard.replace(
                AppPaths.Showcase.Root + "/",
                ""
              ),
              label: "Multi-Step Wizard",
              breadcrumb: "Multi-Step Wizard",
              page: TestMultiStepFormModel,
            },
            {
              id: "showcase.table",
              path: AppPaths.Showcase.Table.replace(
                AppPaths.Showcase.Root + "/",
                ""
              ),
              label: "Branch Management",
              breadcrumb: "Branch Management",
              page: TableDemoPage,
              beforeEnter: async () => {
                console.log(
                  "[Kernel: beforeEnter] Fetching Table Data & Validating Permissions before React mounts..."
                );
              },
              onUpdate: (_ctx, changes) => {
                console.log(
                  "[Kernel: onUpdate] Syncing Table Search Params perfectly:",
                  (changes.current.search as URLSearchParams).toString()
                );
              },
              onLeave: () => {
                console.log(
                  "[Kernel: onLeave] Disposing Table Physics memory and active Workers."
                );
              },
            },
          ],
        },
      ],
    }),
  ];
}

// ── React 19 Bootstrapping ───────────────────────────────────────────────
const fetchManifest = async (retries = 3, delay = 1000): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch("/platform-manifest.json");
      if (!res.ok) throw new Error("Server manifest not found");
      const manifest = await res.json();
      (window as any).__platform_manifest__ = manifest;
      return manifest;
    } catch (err) {
      console.warn(
        `⚠️ [AppBoot]: Fetching manifest failed (attempt ${i + 1}/${retries}):`,
        err
      );
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  console.error(
    "❌ [AppBoot]: All manifest fetch attempts failed. Booting static schema."
  );
  return null;
};

const manifestPromise = fetchManifest();

// Suspense resource wrapper compatible with both React 19 `use` and classic Suspense.
// Avoids conditional hooks by not using hooks at all — just throws the promise.
function wrapPromise<T>(promise: Promise<T>) {
  let status: "pending" | "success" | "error" = "pending";
  let result: T;
  let error: unknown;
  const suspender = promise.then(
    (r) => {
      status = "success";
      result = r;
    },
    (e) => {
      status = "error";
      error = e;
    }
  );
  return {
    read(): T {
      if (status === "pending") throw suspender;
      if (status === "error") throw error;
      return result!;
    },
  };
}

const manifestResource = wrapPromise(manifestPromise);

const routerServices = {
  public: httpClient.public as any,
  auth: httpClient.auth as any,
};

/**
 * PlatformRouterProvider - Handles dynamic manifest fetching with Suspense
 */
export const RouterProvider: React.FC = () => {
  // Prefer React 19 `React.use` if available, otherwise use resource wrapper.
  // The resource wrapper is the source of truth; React.use path is kept for
  // parity but both suspend identically via thrown promise.
  const maybeUse = (React as any).use as unknown as
    | ((p: Promise<any>) => any)
    | undefined;
  const initialManifest =
    typeof maybeUse === "function"
      ? maybeUse(manifestPromise)
      : manifestResource.read();

  // Build base routes lazily after registries are safely initialized
  const baseRoutes = React.useMemo(() => buildBaseRoutes(), []);

  // Compose the full application route tree (validation + manifest + parentId
  // derivation) and create the router exactly once.
  const [{ router: activeRouter, composition }] = React.useState(() => {
    try {
      const composed = composeApplication({
        routes: baseRoutes,
        modules: moduleRegistry.getEnabledModules(),
        attachModulesTo: ROOT_ROUTE_ID,
        manifest: initialManifest,
      });
      return {
        router: createAppRouterFromRoutes(composed.routes, routerServices),
        composition: { routeIndex: composed.routeIndex },
      };
    } catch (err) {
      console.error("[RouterProvider] Failed to construct dynamic router", err);
      return {
        router: createAppRouterFromRoutes(baseRoutes, routerServices),
        composition: { routeIndex: new Map() },
      };
    }
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      window.location.reload();
    };
    window.addEventListener("platform-manifest-updated", handleUpdate);
    return () => {
      window.removeEventListener("platform-manifest-updated", handleUpdate);
    };
  }, []);

  return (
    <CompositionProvider value={composition}>
      <RouterServicesProvider value={routerServices}>
        <ReactRouterProvider
          router={activeRouter}
          {...({ fallbackElement: <ZenosBootSplash /> } as any)}
        />
      </RouterServicesProvider>
    </CompositionProvider>
  );
};

export default RouterProvider;
