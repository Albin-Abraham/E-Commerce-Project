import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { FramerMotion } from "@core/libs/react-motion";
import { cn } from "@ui/form/utils/form-styles";
import {
  AnimatePresence,
  LazyMotion,
  type Variants,
  domAnimation,
  m,
} from "framer-motion";

const floatingVariants: Variants = {
  float1: {
    y: ["-10px", "10px", "-10px"],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
  },
  float2: {
    y: ["10px", "-10px", "10px"],
    transition: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 },
  },
  float3: {
    y: ["-15px", "15px", "-15px"],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 0.5,
    },
  },
};

export const AuthBrandPanel: React.FC = () => {
  const { t } = useTranslation("screens/auth");
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      id: 0,
      title: t("brand.slides.slide1.title"),
      description: t("brand.slides.slide1.description"),
      graphic: (
        <>
          {/* Primary Floating Card: Portfolio Value */}
          <FramerMotion
            variants={floatingVariants}
            animate="float1"
            className="w-72 p-4 bg-surface/80 dark:bg-surface-raised/80 backdrop-blur-xl border border-border/40 dark:border-white/10 rounded-2xl shadow-floating transform -rotate-3 absolute z-20 text-foreground"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                {t("brand.slides.slide1.growth")}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                +14.8%
              </span>
            </div>
            <div className="text-2xl font-black tracking-tight text-foreground mb-1">
              $2,480,500.00
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-3/4 rounded-full" />
            </div>
          </FramerMotion>

          {/* Secondary Floating Card: Capital Allocations */}
          <FramerMotion
            variants={floatingVariants}
            animate="float2"
            className="w-64 p-3.5 bg-surface/80 dark:bg-surface-raised/80 backdrop-blur-lg border border-border/40 dark:border-white/10 rounded-2xl shadow-floating transform rotate-6 absolute z-10 translate-y-20 translate-x-12 text-foreground"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                📊
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">
                  {t("brand.slides.slide1.allocations")}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {t("brand.slides.slide1.yield")}
                </div>
              </div>
            </div>
          </FramerMotion>
        </>
      ),
    },
    {
      id: 1,
      title: t("brand.slides.slide2.title"),
      description: t("brand.slides.slide2.description"),
      graphic: (
        <>
          <FramerMotion
            variants={floatingVariants}
            animate="float1"
            className="w-64 p-4 bg-surface/80 dark:bg-surface-raised/80 backdrop-blur-xl border border-border/40 dark:border-white/10 rounded-2xl shadow-floating transform rotate-2 absolute z-20 text-foreground"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                🌍
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">
                  {t("brand.slides.slide2.nodes")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("brand.slides.slide2.branches")}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div className="text-xs text-muted-foreground">
                {t("brand.slides.slide2.efficiency")}
              </div>
              <div className="text-lg font-bold text-foreground">98.2%</div>
            </div>
          </FramerMotion>

          <FramerMotion
            variants={floatingVariants}
            animate="float3"
            className="w-56 p-3 bg-surface/80 dark:bg-surface-raised/80 backdrop-blur-lg border border-border/40 dark:border-white/10 rounded-xl shadow-floating transform -rotate-6 absolute z-10 -translate-y-16 -translate-x-16 text-foreground"
          >
            <div className="text-xs font-bold text-foreground mb-2">
              {t("brand.slides.slide2.deployments")}
            </div>
            <div className="space-y-2">
              <div className="w-full h-2 bg-primary/40 rounded-full" />
              <div className="w-3/4 h-2 bg-muted rounded-full" />
              <div className="w-5/6 h-2 bg-muted/60 rounded-full" />
            </div>
          </FramerMotion>
        </>
      ),
    },
    {
      id: 2,
      title: t("brand.slides.slide3.title"),
      description: t("brand.slides.slide3.description"),
      graphic: (
        <>
          <FramerMotion
            variants={floatingVariants}
            animate="float1"
            className="w-60 p-5 bg-surface/80 dark:bg-surface-raised/80 backdrop-blur-xl border border-primary/30 rounded-full aspect-square shadow-floating flex flex-col items-center justify-center text-foreground"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl mb-2 border border-primary/20">
              🛡️
            </div>
            <div className="text-sm font-black text-foreground uppercase tracking-widest">
              {t("brand.slides.slide3.zeroTrust")}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {t("brand.slides.slide3.encrypted")}
            </div>
          </FramerMotion>
        </>
      ),
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const currentSlide = slides[activeSlide];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="ZenOS Platform Highlights"
      className="h-full w-full flex flex-col p-6 lg:p-10 bg-gradient-to-br from-primary/10 via-surface-raised/60 to-surface dark:from-primary/15 dark:via-surface-raised/90 dark:to-surface text-foreground border-r border-border/40 relative overflow-hidden group"
    >
      {/* Screen Reader Live Region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Showing slide {activeSlide + 1} of {slides.length}: {currentSlide.title}
      </div>

      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl pointer-events-none transition-colors duration-1000" />
      <div className="absolute bottom-10 right-10 w-60 h-60 bg-primary/10 dark:bg-primary/15 rounded-full blur-2xl pointer-events-none transition-colors duration-1000" />

      {/* Header / Brand Logo */}
      <div className="relative z-10 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-primary/20 group-focus-within:ring-2 ring-primary/50">
          ⚡
        </div>
        <span className="font-black text-xl tracking-tight text-foreground">
          Zen<span className="text-primary">OS</span>
        </span>
      </div>

      <div
        id="carousel-content"
        role="tabpanel"
        aria-roledescription="slide"
        aria-labelledby={`slide-tab-${activeSlide}`}
        className="flex-1 flex flex-col justify-center min-h-0 mt-4 z-10"
      >
        {/* Dynamic Graphic Container */}
        <div
          className="relative w-full h-48 lg:h-56 flex items-center justify-center shrink-0 mb-4"
          aria-hidden="true"
        >
          {/* SVG Background Layer */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
            <LazyMotion features={domAnimation}>
              <svg
                className="w-full h-40 lg:h-48 text-primary"
                viewBox="0 0 400 150"
                fill="none"
              >
                <path
                  d="M0 120 C 50 110, 80 60, 140 80 C 200 100, 240 20, 300 40 C 360 60, 380 10, 400 20"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                />
                <path
                  d="M0 120 C 50 110, 80 60, 140 80 C 200 100, 240 20, 300 40 C 360 60, 380 10, 400 20 L 400 150 L 0 150 Z"
                  fill="url(#primary-auth-gradient)"
                  opacity="0.3"
                />
                <defs>
                  <linearGradient
                    id="primary-auth-gradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="var(--color-primary)" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>

                {/* Computed Reference Line Grid */}
                <g
                  aria-hidden="true"
                  className="opacity-20"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="2 6"
                >
                  <line x1="0" y1="150" x2="400" y2="150" />
                  <line x1="0" y1="112.5" x2="400" y2="112.5" />
                  <line x1="0" y1="75" x2="400" y2="75" />
                  <line x1="0" y1="37.5" x2="400" y2="37.5" />
                  <line x1="0" y1="0" x2="400" y2="0" />
                </g>

                {/* Data Path */}
                <m.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  d="M0 120 C 50 110, 80 60, 140 80 C 200 100, 240 20, 300 40 C 360 60, 380 10, 400 20"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                />
                <m.path
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  d="M0 120 C 50 110, 80 60, 140 80 C 200 100, 240 20, 300 40 C 360 60, 380 10, 400 20 L 400 150 L 0 150 Z"
                  fill="url(#primary-auth-gradient)"
                />
              </svg>
            </LazyMotion>
          </div>

          {/* Animated Graphics Slide Content */}
          <AnimatePresence mode="wait">
            <FramerMotion
              key={`graphic-${activeSlide}`}
              className="absolute inset-0 flex items-center justify-center scale-75 lg:scale-90 xl:scale-100"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {currentSlide.graphic}
            </FramerMotion>
          </AnimatePresence>
        </div>

        {/* Brand Copy */}
        <div className="relative z-10 text-center flex flex-col justify-start shrink-0 h-32 lg:h-40 max-w-sm mx-auto">
          <AnimatePresence mode="wait">
            <FramerMotion
              key={`text-${activeSlide}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full flex flex-col"
            >
              <h2 className="text-xl lg:text-2xl font-extrabold leading-tight tracking-tight text-foreground mb-2">
                {currentSlide.title}
              </h2>
              <p className="text-muted-foreground text-xs lg:text-sm leading-relaxed font-normal">
                {currentSlide.description}
              </p>
            </FramerMotion>
          </AnimatePresence>
        </div>
      </div>

      {/* Slider Controls (Tablist) */}
      <div
        role="tablist"
        aria-label="Slides"
        className="relative z-10 flex justify-center space-x-2 pt-2 shrink-0 mt-auto"
      >
        {slides.map((slide, index) => {
          const isActive = activeSlide === index;
          return (
            <button
              key={slide.id}
              id={`slide-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="carousel-content"
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveSlide(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500 relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isActive
                  ? "w-10 bg-primary/30 shadow-[0_0_10px_var(--color-primary)]"
                  : "w-4 bg-muted hover:bg-muted-foreground/40 cursor-pointer"
              )}
              aria-label={`Go to slide ${index + 1}: ${slide.title}`}
            >
              {isActive && (
                <FramerMotion
                  className="absolute inset-0 bg-primary origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 6, ease: "linear" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default AuthBrandPanel;
