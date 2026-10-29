import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Flex } from "@shared/ui/layout/Flex";
import { Box } from "@shared/ui/layout/Box";
import { Zenith } from "@shared/theme";

const SECTIONS = [
  { id: "hero", labelKey: "nav.overview", fallback: "Overview" },
  { id: "trust", labelKey: "nav.trust", fallback: "Trust" },
  { id: "navigation", labelKey: "nav.modules", fallback: "Modules" },
  { id: "analytics", labelKey: "nav.analytics", fallback: "Analytics" },
  { id: "marketplace", labelKey: "nav.marketplace", fallback: "Marketplace" },
  { id: "features", labelKey: "nav.features", fallback: "Features" },
];

export function HomeContentAnchorBar() {
  const { t } = useTranslation("screens/dashboard");
  const [activeId, setActiveId] = useState<string>("hero");
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      // Reveal floating anchor pill bar once user starts scrolling down
      setIsScrolled(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0.1 }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!isScrolled) return null;

  return (
    <Box
      data-unit="content-anchor-bar"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none"
    >
      <Flex
        align="center"
        gap="xs"
        p="xs"
        className={Zenith.cn(
          "bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-full",
          "p-1.5 pointer-events-auto max-w-[90vw] overflow-x-auto scrollbar-none"
        )}
      >
        {SECTIONS.map(({ id, labelKey, fallback }) => {
          const isCurrent = activeId === id;
          const label = t(labelKey, fallback);

          return (
            <button
              key={id}
              type="button"
              data-section-id={id}
              data-active={isCurrent ? "true" : "false"}
              aria-current={isCurrent ? "true" : undefined}
              onClick={() => scrollToSection(id)}
              className={Zenith.cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer",
                isCurrent
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
              )}
            >
              {label}
            </button>
          );
        })}
      </Flex>
    </Box>
  );
}
