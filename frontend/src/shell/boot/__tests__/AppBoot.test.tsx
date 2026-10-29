import { RouterProvider, createMemoryRouter } from "react-router-dom";

import { createAppRouterFromRoutes } from "@core/router/helpers/route.utils.tsx";
import { defineRoute } from "@core/router/route.types";
import type { AppRoute } from "@core/router/route.types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Import the actual components after mocking
import ProductsPage from "@pages/products/product.list";
import CreateBranch from "@pages/static-pages/CreateBranch";
import FormBuilderPage from "@pages/static-pages/FormBuilderPage";
import Home from "@pages/static-pages/Home";
import TestFormModel from "@pages/static-pages/form";
import TestMultiStepFormModel from "@pages/static-pages/multi-step-form";

import RootLayout from "../../layouts/RootLayer";

// Mock the page components
vi.mock("@pages/products/product.list.tsx", () => ({
  default: () => <div data-testid="products-page">Products Page</div>,
}));

vi.mock("@pages/static-pages/form.tsx", () => ({
  default: () => <div data-testid="form-page">Form Page</div>,
}));

vi.mock("@pages/static-pages/CreateBranch.tsx", () => ({
  default: () => <div data-testid="create-branch-page">Create Branch Page</div>,
}));

vi.mock("@pages/static-pages/FormBuilderPage.tsx", () => ({
  default: () => <div data-testid="form-builder-page">Form Builder Page</div>,
}));

vi.mock("@pages/static-pages/multi-step-form.tsx", () => ({
  default: () => (
    <div data-testid="multi-step-form-page">Multi Step Form Page</div>
  ),
}));

vi.mock("@pages/static-pages/Home.tsx", () => ({
  default: () => <div data-testid="home-page">Home Page</div>,
}));

vi.mock("@pages/static-pages/About.tsx", () => ({
  default: () => <div data-testid="about-page">About Page</div>,
}));

// Mock RootLayout to avoid layout complexity
vi.mock("../../layouts/RootLayer.tsx", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="root-layout">{children}</div>
  ),
}));

// Mock the product query service
vi.mock("@services/product.query", () => ({
  fetchProducts: vi.fn(() => Promise.resolve({ products: [] })),
}));

// Mock framer-motion
vi.mock("framer-motion", () => {
  const mockComponent = ({ children, className, style, ...props }: any) => (
    <div className={className} style={style} {...props}>
      {children}
    </div>
  );

  return {
    motion: new Proxy(
      {},
      {
        get: () => mockComponent,
      }
    ),
    m: new Proxy(
      {},
      {
        get: () => mockComponent,
      }
    ),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

describe("AppBoot Route Rendering", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  // Define the same routes as AppBoot
  const appRoutes: AppRoute[] = [
    defineRoute({
      id: "test.root",
      path: "/",
      layout: RootLayout,
      children: [
        {
          id: "test.home",
          index: true,
          path: "/",
          page: Home,
        },
        {
          id: "test.products",
          path: "products",
          page: ProductsPage,
          suspense: <div>Loading Products...</div>,
        },
        {
          id: "test.form",
          path: "form",
          page: TestFormModel,
        },
        {
          id: "test.branch",
          path: "branch/new",
          page: CreateBranch,
        },
        {
          id: "test.builder",
          path: "builder",
          page: FormBuilderPage,
        },
        {
          id: "test.multi-step",
          path: "multi-step",
          page: TestMultiStepFormModel,
        },
        {
          id: "test.not-found",
          path: "*",
          page: () => <div>404 Not Found</div>,
        },
      ],
    }),
  ];
  const mockServices = {
    public: {} as any,
    auth: {} as any,
  };

  const renderWithRouter = (initialRoute = "/") => {
    const router = createMemoryRouter(
      createAppRouterFromRoutes(appRoutes, mockServices).routes,
      {
        initialEntries: [initialRoute],
      }
    );

    return render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );
  };

  it("should render Home page at root route", async () => {
    renderWithRouter("/");

    await waitFor(() => {
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });
  });

  it("should render Products page at /products route", async () => {
    renderWithRouter("/products");

    await waitFor(() => {
      expect(screen.getByTestId("products-page")).toBeInTheDocument();
    });
  });

  it("should render Form page at /form route", async () => {
    renderWithRouter("/form");

    await waitFor(() => {
      expect(screen.getByTestId("form-page")).toBeInTheDocument();
    });
  });

  it("should render Create Branch page at /branch/new route", async () => {
    renderWithRouter("/branch/new");

    await waitFor(() => {
      expect(screen.getByTestId("create-branch-page")).toBeInTheDocument();
    });
  });

  it("should render Form Builder page at /builder route", async () => {
    renderWithRouter("/builder");

    await waitFor(() => {
      expect(screen.getByTestId("form-builder-page")).toBeInTheDocument();
    });
  });

  it("should render Multi Step Form page at /multi-step route", async () => {
    renderWithRouter("/multi-step");

    await waitFor(() => {
      expect(screen.getByTestId("multi-step-form-page")).toBeInTheDocument();
    });
  });

  it("should render 404 page for unknown routes", async () => {
    renderWithRouter("/unknown-route");

    await waitFor(() => {
      expect(screen.getByText("404 Not Found")).toBeInTheDocument();
    });
  });

  it("should wrap all routes with RootLayout", async () => {
    renderWithRouter("/");

    await waitFor(() => {
      expect(screen.getByTestId("root-layout")).toBeInTheDocument();
    });
  });
});
