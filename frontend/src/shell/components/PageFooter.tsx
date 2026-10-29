import React from "react";
import { useTranslation } from "react-i18next";

import { Slot } from "@core/slots";

import { Zenith } from "@shared/theme";

export const PageFooter: React.FC = () => {
  const { t } = useTranslation("layouts/navigation");

  return (
    <footer
      className={Zenith.patterns.app.footer + " text-center text-sm mt-auto"}
    >
      <div className="flex items-center justify-center gap-4 mb-2">
        <Slot name="footer-links" />
      </div>
      <p className="opacity-60">
        {t("footer.copyright", { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
};
