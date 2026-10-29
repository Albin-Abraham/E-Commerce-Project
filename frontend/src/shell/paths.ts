export const AppPaths = {
  Root: "/",
  Workspace: "/workspace",
  Login: "/login",
  About: "/about",
  Builder: "/builder",
  NotFound: "*",
  Forbidden: "/403",
  Showcase: {
    Root: "/showcase",
    Auth: "/showcase/auth",
    Employee: "/showcase/employee",
    Branch: "/showcase/branch",
    Wizard: "/showcase/wizard",
    Table: "/showcase/table",
  },
  Account: {
    Root: "/account",
    Profile: "/account/profile",
    Settings: "/account/settings",
  },
  Products: {
    List: "/products",
    Detail: "/products/:id",
    Analytics: "/products/analytics",
    Inventory: "/products/inventory",
  },
} as const;
