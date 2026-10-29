import { useTranslation } from "react-i18next";
import { Button } from "@ui/button";

import { Zenith } from "@shared/theme";

export function HomeHeader() {
  const { t } = useTranslation("screens/dashboard");

  const navItems = [
    { label: t("header.home"), href: "#" },
    { label: t("header.features"), href: "#" },
    { label: t("header.showcase"), href: "#" },
    { label: t("header.pricing"), href: "#" },
  ];

  return (
    <header className={Zenith.shell("header")}>
      <div
        {...Zenith.container()}
        className={Zenith.cn(
          Zenith.container().className,
          "flex items-center justify-between h-full"
        )}
      >
        <div className="flex items-center gap-12">
          <div
            className={Zenith.cn(
              Zenith.text("h2"),
              "flex items-center gap-3 group cursor-pointer m-0"
            )}
          >
            <div className="w-8 h-8 bg-primary rounded-lg rotate-45 group-hover:rotate-90 transition-transform duration-500 shadow-neon-primary" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 group-hover:from-primary group-hover:to-secondary transition-all">
              {t("header.title")}
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            className="hidden sm:inline-flex bg-transparent border-none shadow-none"
          >
            {t("header.login")}
          </Button>
          <Button variant="primary" className="shadow-lg shadow-primary/20">
            {t("header.signUp")}
          </Button>
        </div>
      </div>
    </header>
  );
}
