import { useTranslation } from "react-i18next";
import { useThemeStore } from "@core/state/theme.store";
import { Button } from "@ui/button";

import { Zenith } from "@shared/theme";

import { useModal } from "@hooks/useModal";

import { FramerMotion } from "@libs/react-motion";

import { OverrideAuthenticationOverlay } from "./OverrideAuthenticationOverlay";

export function HomeHero() {
  const { t } = useTranslation("screens/dashboard");
  const { isOpen, openModal, onOpenChange } = useModal();
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <FramerMotion
      variant="swipeBottom"
      zIndex="accent"
      viewport={{ once: true }}
      className="relative w-full"
    >
      <div {...Zenith.container()}>
        <div className={Zenith.hero("container") + " mb-24"}>
          {/* Neon Spotlight Effect */}
          <div className={Zenith.hero("blobPrimary")} />
          <div className={Zenith.hero("blobSecondary")} />

          {/* Animated Architectural Grid Background */}
          <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none z-0" />
          <div className="absolute inset-0 bg-architectural-grid pointer-events-none z-0" />

          <div
            className={`relative ${Zenith.z("accent")} text-center max-w-4xl mx-auto`}
          >
            <div
              className={
                Zenith.badgeVariants({ intent: "primary", isPulsing: true }) +
                " mb-10"
              }
            >
              <span className="relative flex h-2 w-2 mr-2 inline-block">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {t("hero.badge")}
            </div>
            <h1
              className={
                Zenith.text("h1", true) + " mb-10 drop-shadow-2xl leading-[1.1]"
              }
            >
              <span className="text-gradient-pulse">
                {t("hero.titleGradient")}
              </span>
              <br />
              <span className="text-foreground tracking-tighter">
                {t("hero.titleRest")}
              </span>
            </h1>
            <p
              className={
                Zenith.text("body", true) +
                " max-w-2xl mx-auto opacity-70 mb-14 font-medium leading-relaxed"
              }
            >
              {t("hero.description")}
            </p>

            <div className="flex flex-wrap gap-6 justify-center mt-12 relative z-20">
              <Button
                variant="primary"
                size="lg"
                className="h-16 px-10 text-lg hover:scale-105 transition-transform duration-300 shadow-neon-primary rounded-xl"
                onClick={openModal}
              >
                {t("hero.buttons.initKernel")}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-16 px-10 text-lg hover:scale-105 transition-all duration-300 shadow-xl rounded-xl"
                onClick={toggleTheme}
              >
                {t("hero.buttons.switchEnvironment")}
              </Button>
            </div>
          </div>
        </div>

        {/* 1000000x Styled Mockup - Standardized Alignment */}
        <div
          className={`relative w-full max-w-6xl mx-auto ${Zenith.z("overlap")} group mb-24`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-secondary/20 to-accent/30 rounded-[3rem] blur-3xl opacity-60 dark:opacity-20 animate-pulse" />

          <div
            className={
              Zenith.hero("mockup") +
              " border-[rgba(0,0,0,0.1)] dark:border-white/5 rounded-[2.5rem]"
            }
          >
            <div className="h-10 border-b border-border/20 bg-muted/10 flex items-center px-4 gap-2 backdrop-blur-md">
              <div className="w-3 h-3 rounded-full bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              <div className="w-3 h-3 rounded-full bg-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <div className="flex-1" />
              <div className="h-4 w-24 bg-muted/40 rounded-full" />
            </div>
            <div className="p-8 grid grid-cols-12 gap-6">
              <div className="col-span-3 space-y-4">
                <div className="h-8 w-full bg-gradient-to-r from-primary/30 to-transparent rounded-md" />
                <div className="h-32 w-full bg-muted/10 rounded-md border border-border/20 backdrop-blur-sm" />
              </div>
              <div className="col-span-9 space-y-6">
                <div className="h-12 w-full bg-muted/10 rounded-md flex items-center px-4 gap-4 border border-border/10">
                  <div className="h-4 w-4 bg-secondary/60 rounded-full animate-ping" />
                  <div className="h-3 w-1/3 bg-muted/40 rounded-full" />
                </div>
                <div className="h-48 w-full bg-muted/5 rounded-lg border border-dashed border-border/40 relative overflow-hidden group-hover:border-primary/50 transition-colors duration-700">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-colors duration-1000" />
                </div>
              </div>
            </div>
          </div>

          {/* Floating Parallax Widget 1 (Top Left) */}
          <div className="absolute -left-8 -top-12 md:-left-16 md:top-8 w-48 bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl p-4 shadow-floating z-20 group-hover:-translate-y-6 group-hover:-translate-x-4 transition-transform duration-[1500ms] ease-out animate-[float_6s_ease-in-out_infinite]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_var(--color-primary)]" />
              </div>
              <div>
                <div className="h-2 w-16 bg-muted/40 rounded-full mb-1.5" />
                <div className="h-2 w-24 bg-muted/20 rounded-full" />
              </div>
            </div>
            <div className="h-1.5 w-full bg-border/50 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-primary to-accent animate-[pulse_2s_ease-in-out_infinite]" />
            </div>
          </div>

          {/* Floating Parallax Widget 2 (Bottom Right) */}
          <div className="absolute -right-4 -bottom-16 md:-right-12 md:-bottom-12 w-56 bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl p-5 shadow-floating z-20 group-hover:translate-y-4 group-hover:translate-x-4 transition-transform duration-[2000ms] ease-out animate-[float_7s_ease-in-out_infinite_1s]">
            <div className="flex justify-between items-center mb-4">
              <div className="h-2 w-20 bg-muted/40 rounded-full" />
              <div className="text-[10px] font-black text-secondary tracking-widest uppercase">
                +24%
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 items-end h-12">
              {[1, 2, 3, 2, 4].map((h, i) => (
                <div
                  key={i}
                  className={`w-full rounded-t-sm ${i === 4 ? "bg-gradient-to-t from-secondary/50 to-secondary" : "bg-muted/20"}`}
                  style={{ height: `${h * 25}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <OverrideAuthenticationOverlay
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          onConfirm={() => {}}
        />
      </div>
    </FramerMotion>
  );
}
