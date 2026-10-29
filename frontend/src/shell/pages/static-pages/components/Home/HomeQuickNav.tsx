import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@shared/ui/layout/Box";
import { VStack } from "@shared/ui/layout/VStack";
import { Text } from "@shared/ui/atoms/Text";
import { Zenith } from "@shared/theme";

const SECTIONS = [
  { id: "hero", labelKey: "nav.overview", fallback: "Overview" },
  { id: "trust", labelKey: "nav.trust", fallback: "Trust & Security" },
  { id: "navigation", labelKey: "nav.modules", fallback: "Platform Modules" },
  { id: "analytics", labelKey: "nav.analytics", fallback: "KPI & Stats" },
  { id: "marketplace", labelKey: "nav.marketplace", fallback: "Marketplace" },
  { id: "features", labelKey: "nav.features", fallback: "Core Features" },
];

export function HomeQuickNav() {
  const { t } = useTranslation("screens/dashboard");
  const [activeId, setActiveId] = useState<string>("hero");

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

  const handleScroll = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Box
      asChild
      data-unit="quick-nav"
      className="hidden xl:block sticky top-28 w-60 pl-6 border-l border-border/20 self-start z-20"
    >
      <aside role="complementary" aria-label="Page Navigation Anchors">
        <Text
          as="p"
          variant="caption"
          className="font-bold text-muted-foreground uppercase tracking-widest mb-4"
        >
          {t("quickNav.title", "On This Page")}
        </Text>

        <VStack gap="xs" asChild>
          <nav role="navigation" data-unit="nav-anchors">
            {SECTIONS.map(({ id, labelKey, fallback }) => {
              const isCurrent = activeId === id;
              const label = t(labelKey, fallback);

              return (
                <a
                  key={id}
                  href={`#${id}`}
                  data-section-id={id}
                  data-active={isCurrent ? "true" : "false"}
                  aria-current={isCurrent ? "true" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(id);
                  }}
                  className={Zenith.cn(
                    "block text-sm py-1.5 px-3 rounded-lg transition-all duration-200 text-muted-foreground",
                    "hover:text-foreground hover:bg-surface/50",
                    "data-[active=true]:text-primary data-[active=true]:font-semibold data-[active=true]:bg-primary/10 data-[active=true]:translate-x-1",
                    "aria-[current=true]:shadow-xs"
                  )}
                >
                  {label}
                </a>
              );
            })}
          </nav>
        </VStack>
      </aside>
    </Box>
  );
}
