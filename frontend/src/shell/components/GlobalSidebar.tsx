import React from "react";
import { useTranslation } from "react-i18next";

import { Slot } from "@core/slots";

import { Zenith } from "@shared/theme";

import { Sidebar as CompoundSidebar } from "@/shared/ui/navigation/sidebar/sidebar";
import { AppPaths } from "../paths";
import { useNavigationSurface } from "../view-controller/surface/useSurface";

export const GlobalSidebar: React.FC = () => {
  const { t } = useTranslation("layouts/navigation");
  // Navigation open/collapsed state now owned by SurfaceManager.
  // useSidebarStore retains group-expansion state (a separate, smaller concern).
  const { isExpanded } = useNavigationSurface();

  return (
    <CompoundSidebar>
      <CompoundSidebar.Brand
        href={AppPaths.Root}
        brandText={t("brand.name")}
      />
      <CompoundSidebar.Header />
      <CompoundSidebar.Body>
        <CompoundSidebar.Content>
          <div className="space-y-6">
            <div>
              {isExpanded && (
                <h3
                  className={Zenith.patterns.typography.caption + " mb-4 px-3"}
                >
                  {t("sections.navigation")}
                </h3>
              )}
              <Slot
                name="sidebar-nav"
                fallback={<CompoundSidebar.MainSection />}
              />
            </div>

            <div>
              {isExpanded && (
                <h3
                  className={Zenith.patterns.typography.caption + " mb-4 px-3"}
                >
                  {t("sections.utilities")}
                </h3>
              )}
              <Slot
                name="sidebar-utils"
                fallback={<CompoundSidebar.SystemSection />}
              />
            </div>
          </div>
        </CompoundSidebar.Content>
      </CompoundSidebar.Body>

      <CompoundSidebar.Footer className="!p-4 bg-black/10">
        <Slot name="sidebar-footer" />
      </CompoundSidebar.Footer>
    </CompoundSidebar>
  );
};
