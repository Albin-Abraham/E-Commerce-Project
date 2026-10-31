import React from "react";
import { RouterProvider } from "react-router-dom";

import { composeApplication } from "@core/router/composition/compose-application";
import { CompositionProvider } from "@core/router/composition/CompositionContext";
import { createAppRouterFromRoutes } from "@core/router/adapters/ReactRouterAdapter";
import { defineRoute } from "@core/router/route.types";
import type { AppRoute } from "@core/router/route.types";
import { RouterServicesProvider } from "@core/router/services/RouterServicesContext";

// Services
import { httpClient } from "@services/http.instance";

import { AppPaths } from "../paths";
import { sharedPublicRoutes } from "./public.routes";

import { ForbiddenErrorState } from "@shared/ui/errors";

// Public Pages
const AuthPortalPage = React.lazy(
  () => import("@pages/static-pages/AuthPortalPage")
);

const authRoutes: AppRoute[] = [
  defineRoute({
    id: "auth.portal.showcase",
    path: AppPaths.Showcase.Auth,
    page: AuthPortalPage,
  }),
  defineRoute({
    id: "auth.portal.login",
    path: AppPaths.Login,
    page: AuthPortalPage,
  }),
  defineRoute({
    id: "auth.portal.register",
    path: AppPaths.Register,
    page: AuthPortalPage,
  }),
  defineRoute({
    id: "auth.portal.forgot-password",
    path: AppPaths.ForgotPassword,
    page: AuthPortalPage,
  }),
  defineRoute({
    id: "auth.portal.root",
    path: AppPaths.Root,
    page: AuthPortalPage,
  }),
  defineRoute({
    id: "auth.forbidden",
    path: AppPaths.Forbidden,
    page: ForbiddenErrorState,
  }),
  defineRoute({
    id: "auth.not-found",
    path: AppPaths.NotFound,
    redirectTo: AppPaths.Login,
  }),
  // Inject all shared public routes (About, Privacy, etc.)
  ...sharedPublicRoutes,
];

const composed = composeApplication({ routes: authRoutes });

const routerServices = {
  public: httpClient.public as any,
  auth: httpClient.auth as any,
};

const router = createAppRouterFromRoutes(composed.routes, routerServices);

const AuthBoot: React.FC = () => {
  return (
    <CompositionProvider value={{ routeIndex: composed.routeIndex }}>
      <RouterServicesProvider value={routerServices}>
        <RouterProvider router={router} />
      </RouterServicesProvider>
    </CompositionProvider>
  );
};

export default AuthBoot;
