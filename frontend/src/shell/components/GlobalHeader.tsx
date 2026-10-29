import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { PlatformLink } from "@core/router/helpers/prefetch";
import { Slot } from "@core/slots";
import { useThemeStore } from "@core/state/theme.store";
import { NavDropdown } from "@ui/navigation/NavDropdown";
import { BarChart3, Building2, LogOut, Moon, Package, Sun, Zap } from "lucide-react";
import { Zenith } from "@shared/theme";

import { useAuth } from "@hooks/auth/useAuth";
import { AppPaths } from "../paths";

const LANGUAGES = [
  { code: "en", label: "English (US)", flag: "🇺🇸" },
  { code: "es", label: "Español (ES)", flag: "🇪🇸" },
  { code: "fr", label: "Français (FR)", flag: "🇫🇷" },
  { code: "de", label: "Deutsch (DE)", flag: "🇩🇪" },
];

const LanguageDropdown: React.FC = () => {
  const { i18n } = useTranslation();
  const currentCode = (i18n.language || "en").substring(0, 2).toLowerCase();
  const currentLang = LANGUAGES.find((l) => l.code === currentCode) || LANGUAGES[0];

  return (
    <NavDropdown
      label={`${currentLang.flag} ${currentLang.code.toUpperCase()}`}
      items={LANGUAGES.map((lang) => ({
        label: `${lang.flag} ${lang.label}`,
        onClick: () => i18n.changeLanguage(lang.code),
      }))}
    />
  );
};

const ThemeToggle: React.FC = () => {
  const { mode, toggleTheme } = useThemeStore();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-border/40 hover:border-border bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
      title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
      aria-label="Toggle Theme"
    >
      {mode === "dark" ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700" />
      )}
    </button>
  );
};

const UserProfileMenu: React.FC = () => {
  const { t } = useTranslation("layouts/navigation");
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    return (
      <PlatformLink
        to={AppPaths.Login}
        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm shrink-0"
      >
        {t("header.signIn")}
      </PlatformLink>
    );
  }

  return (
    <NavDropdown
      label={user.username || user.email || "Account"}
      items={[
        {
          label: t("header.workspaceContext"),
          description: t("header.workspaceContextDesc"),
          onClick: () => navigate(AppPaths.Workspace),
          icon: <Building2 className="w-4 h-4 text-primary" />,
        },
        {
          label: t("header.signOut"),
          description: t("header.signOutDesc"),
          onClick: async () => {
            await logout();
            navigate(AppPaths.Login);
          },
          icon: <LogOut className="w-4 h-4 text-destructive" />,
        },
      ]}
    />
  );
};

export const GlobalHeader: React.FC = () => {
  const { t } = useTranslation("layouts/navigation");

  return (
    <header className="h-16 px-6 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between gap-4">
      {/* LEFT SECTION: Logo & Primary Navigation */}
      <div className="flex items-center gap-4 shrink-0">
        <PlatformLink
          to={AppPaths.Root}
          className={Zenith.cn("font-bold text-xl tracking-tight text-primary flex items-center gap-1.5")}
        >
          {t("brand.name")} <span className="text-muted-foreground font-normal text-xs uppercase tracking-wider">{t("header.platform")}</span>
        </PlatformLink>
        <div className={Zenith.patterns.borders.subtle + " h-5 w-[1px] mx-1"} />
        <nav className="hidden md:flex gap-4 items-center">
          <PlatformLink to={AppPaths.Workspace} className="nav-zenith text-sm font-medium">
            {t("header.workspace")}
          </PlatformLink>

          <NavDropdown
            label={t("header.products")}
            items={[
              {
                label: t("header.allProducts"),
                description: t("header.allProductsDesc"),
                href: AppPaths.Products.List,
                icon: <Package className="w-4 h-4" />,
              },
              {
                label: t("header.analytics"),
                description: t("header.analyticsDesc"),
                href: AppPaths.Products.Analytics,
                icon: <BarChart3 className="w-4 h-4" />,
              },
              {
                label: t("header.builder"),
                description: t("header.builderDesc"),
                href: AppPaths.Builder,
                icon: <Zap className="w-4 h-4" />,
              },
            ]}
          />
        </nav>
      </div>

      {/* CENTER SECTION: Global Search */}
      <div className="flex-1 max-w-lg mx-4 hidden lg:block">
        <Slot name="header-search" />
      </div>

      {/* RIGHT SECTION: Language, Theme & User Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Language Selector Dropdown */}
        <LanguageDropdown />
        {/* Theme Toggle (Light / Dark) */}
        <ThemeToggle />
        {/* Dynamic Header Actions Slot */}
        <Slot name="header-actions" />
        {/* Dynamic User Profile Slot with fallback */}
        <Slot name="user-profile" fallback={<UserProfileMenu />} />
      </div>
    </header>
  );
};
