import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

export function HomeFooter() {
  const { t } = useTranslation("screens/dashboard");

  return (
    <div className="text-center text-muted-foreground text-sm">
      <p>{t("footer.copyright")}</p>
      <div className="mt-4 flex justify-center gap-6">
        <a href="#" className="hover:text-primary transition-colors">
          {t("footer.docs")}
        </a>
        <a href="#" className="hover:text-primary transition-colors">
          {t("footer.github")}
        </a>
        <NavLink to="/debug" className="hover:text-primary transition-colors">
          {t("footer.systemDebug")}
        </NavLink>
      </div>
    </div>
  );
}
