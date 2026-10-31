import React from "react";

import type { AppRoute } from "@core/router/route.types";
import { AppPaths } from "@shell/paths";

// Public Pages
const About = React.lazy(() => import("@pages/static-pages/About"));
const DetailShowcasePage = React.lazy(
  () => import("@pages/static-pages/DetailShowcasePage")
);

/**
 * Shared Public Routes
 *
 * These routes are completely independent of authentication state.
 * By extracting them here, we ensure they are DRY, maintainable, and
 * accessible in both the AuthBoot (logged out) and AppBoot (logged in) routers.
 */
export const sharedPublicRoutes: AppRoute[] = [
  {
    id: "about",
    path: AppPaths.About,
    page: About,
    // Add layout: RootLayout here if you want it applied to the About page everywhere!
  },
  {
    id: "showcase.detail",
    path: AppPaths.Showcase.Detail,
    page: DetailShowcasePage,
  },
  // In the future, add Pricing, Privacy Policy, Terms of Service, etc., here.
];
