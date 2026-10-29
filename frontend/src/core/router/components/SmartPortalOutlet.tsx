import type { CSSProperties, FC, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Outlet, useMatches } from "react-router-dom";

import { useBreadcrumbResolution } from "../hooks/useBreadcrumbResolution";
import type { AppRoute } from "../route.types";

interface RouteMatch {
  id: string;
  pathname: string;
  params: any;
  data: any;
  handle: AppRoute;
}

/**
 * SmartPortalOutlet
 *
 * Works like a standard <Outlet />, but if the child route has a
 * displayMode of "modal", "drawer", or "onCanvas", it projects
 * the element into a React Portal instead of rendering inline.
 */
export const SmartPortalOutlet: FC = () => {
  const matches = useMatches() as unknown as RouteMatch[];

  // Find the deepest match that has a displayMode and a custom component
  // (Ignoring the current parent match)
  const portalMatch = matches.find(
    (m) => m.handle?.displayMode && m.handle?.displayMode !== "page"
  );

  if (!portalMatch) {
    return <Outlet />;
  }

  const { displayMode, portalProps } = portalMatch.handle;

  // If it's a portal-based mode, we render nothing inline
  // (preserving the parent view) and project the outlet to a portal root.
  return (
    <>
      <Portal backdrop={true} mode={displayMode as string} {...portalProps}>
        <Outlet />
      </Portal>
    </>
  );
};

/**
 * Internal Portal Renderer
 */
const Portal: FC<{
  children: ReactNode;
  mode: string;
  backdrop?: boolean;
  title?: string;
  width?: string | number;
}> = ({ children, mode, title, width }) => {
  const mountNode = document.getElementById("portal-root") || document.body;

  // Simple Modal/Drawer wrapper implementation
  const overlayStyle: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: mode === "drawer" ? "flex-end" : "center",
    alignItems: mode === "drawer" ? "stretch" : "center",
    zIndex: 9000, // system layer — use var(--z-system) for CSS
  };

  const contentStyle: CSSProperties = {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: mode === "drawer" ? "0" : "8px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    width: width || (mode === "drawer" ? "400px" : "auto"),
    minWidth: "300px",
    position: "relative",
  };

  return createPortal(
    <div className="portal-overlay" style={overlayStyle}>
      <div className="portal-content" style={contentStyle}>
        <div
          className="portal-header"
          style={{
            marginBottom: "15px",
            borderBottom: "1px solid #eee",
            paddingBottom: "10px",
          }}
        >
          <RenderBreadcrumbs />
          {title && (
            <h2 style={{ marginTop: "10px", marginBottom: 0 }}>{title}</h2>
          )}
        </div>
        {children}
      </div>
    </div>,
    mountNode
  );
};
/**
 * Local Breadcrumb Renderer for Portals
 */
const RenderBreadcrumbs: FC = () => {
  const matches = useMatches() as any;
  const { crumbs, status } = useBreadcrumbResolution(matches);

  return (
    <nav
      style={{ fontSize: "0.8rem", color: "#666" }}
      className={status === "loading" ? "animate-pulse" : ""}
    >
      {crumbs.map((item, index) => (
        <span key={item.id}>
          {item.label}
          {index < crumbs.length - 1 && " > "}
        </span>
      ))}
    </nav>
  );
};
