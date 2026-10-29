import { Suspense, lazy, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { LogCommand } from "@core/events/interfaces/LogCommand";
import { useEventRegistry } from "@core/events/stores/eventRegistry.store";

import { Zenith } from "@shared/theme";
import { PageSkeleton } from "@shared/ui";
import { Text } from "@shared/ui/atoms/Text";
import { Box } from "@shared/ui/layout/Box";
import { Flex } from "@shared/ui/layout/Flex";
import { Grid } from "@shared/ui/layout/Grid";
import { VStack } from "@shared/ui/layout/VStack";

import { useAppBoot } from "@hooks/useAppBoot";
import { FramerMotion } from "@libs/react-motion";

import "../../../index.css";
import {
  HomeContentAnchorBar,
  HomeFeatures,
  HomeHero,
  HomeNavGrid,
  HomeStats,
  HomeTrust,
} from "./components/Home";
import { useHomeMachine } from "./machines/homeMachine";

const ProductList = lazy(() =>
  import("@features/products/app/ProductList").then((m) => ({
    default: m.ProductList,
  }))
);

/**
 * Home Page Component (Orchestrated by lightweight hook & semantic primitives)
 */
function Home() {
  const { t } = useTranslation("screens/dashboard");
  const [bootState, send] = useHomeMachine();

  const { init, isReady, hasError, error } = useAppBoot({
    version: "1.0.0",
    simulateAsyncCheck: async () => {
      if (import.meta.env.DEV) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      return true;
    },
  });

  const {
    registerShortcut,
    unregisterShortcut,
    registerMouseAction,
    unregisterMouseAction,
  } = useEventRegistry();

  useEffect(() => {
    init();

    // Register Sample Events for Verification
    const saveCmd = new LogCommand("Global Save Triggered");
    const featureCmd = new LogCommand("Feature Clicked via Delegation");

    registerShortcut("global-save", {
      key: "ctrl+s",
      command: saveCmd,
      description: "Trigger a global save log",
      enabled: true,
    });

    registerMouseAction("feature-delegation", {
      selector: "[data-delegated-action='feature']",
      command: featureCmd,
      description: "Log feature clicks",
      enabled: true,
    });

    return () => {
      unregisterShortcut("global-save");
      unregisterMouseAction("feature-delegation");
    };
  }, [
    init,
    registerShortcut,
    unregisterShortcut,
    registerMouseAction,
    unregisterMouseAction,
  ]);

  // Synchronize Boot with State Machine
  useEffect(() => {
    if (isReady) send({ type: "BOOT_COMPLETE" });
    if (hasError) send({ type: "BOOT_FAIL" });
  }, [isReady, hasError, send]);

  if (bootState.matches("error")) {
    return (
      <Flex
        align="center"
        justify="center"
        p="2xl"
        className="min-h-screen bg-background"
      >
        <VStack
          gap="lg"
          p="xl"
          className="text-center bg-destructive/10 rounded-2xl border border-destructive/20 shadow-premium max-w-md"
        >
          <Text as="h2" variant="h2" className="text-destructive font-bold">
            {t("fault.title")}
          </Text>
          <Text as="p" variant="body" className="text-muted-foreground">
            {(error as any)?.message || t("fault.fallbackMessage")}
          </Text>
          <button
            onClick={() => send({ type: "RETRY" })}
            className="px-6 py-2 bg-destructive text-destructive-foreground rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            {t("fault.resetKernel")}
          </button>
        </VStack>
      </Flex>
    );
  }

  if (bootState.matches("initializing")) return <PageSkeleton />;

  return (
    <>
      {/* 1. Skip-to-content Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-xl focus:outline-none"
      >
        Skip to main content
      </a>

      {/* 2. Main Page Container */}
      <Box className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 3. Semantic <main> Landmark */}
        <main id="main-content" role="main" aria-label="Home Dashboard" className="w-full space-y-24">
          
          {/* Section 1: Hero Infrastructure */}
          {(bootState.matches("revealingHero") ||
            bootState.matches("revealingContent") ||
            bootState.matches("active")) && (
            <Box asChild className="scroll-mt-24">
              <section id="hero" data-section-id="hero" {...Zenith.section("hero")}>
                <HomeHero />
              </section>
            </Box>
          )}

          {/* Section 2: Trust & Validation */}
          <Box asChild py="xl" className="scroll-mt-24">
            <section id="trust" data-section-id="trust" {...Zenith.section("trust")}>
              <HomeTrust />
            </section>
          </Box>

          {/* Stage 2: Synchronized Content Stagger */}
          {(bootState.matches("revealingContent") ||
            bootState.matches("active")) && (
            <FramerMotion variant="fade" transition={{ duration: 0.8 }}>
              
              {/* Section 3: Navigation Grid */}
              <Box asChild className="scroll-mt-24 mb-24">
                <section id="navigation" data-section-id="navigation" {...Zenith.section("navigation")}>
                  <HomeNavGrid />
                </section>
              </Box>

              {/* Section 4: Analytics & Stats */}
              <Box asChild className="scroll-mt-24 mb-24">
                <section
                  id="analytics"
                  data-section-id="analytics"
                  {...Zenith.section("analytics")}
                  className={Zenith.cn(
                    Zenith.section("analytics").className,
                    "bg-surface/30 rounded-3xl p-8 border border-border/20"
                  )}
                >
                  <HomeStats />
                </section>
              </Box>

              {/* Section 5: Marketplace Ecosystem */}
              <Box asChild py="xl" className="scroll-mt-24 mb-24">
                <section id="marketplace" data-section-id="marketplace" {...Zenith.section("marketplace")}>
                  <Suspense
                    fallback={
                      <Grid columns={4} gap="lg">
                        {[1, 2, 3, 4].map((i) => (
                          <Box
                            key={i}
                            className="h-[380px] bg-surface/50 animate-pulse rounded-3xl border border-border/40"
                          />
                        ))}
                      </Grid>
                    }
                  >
                    <ProductList />
                  </Suspense>
                </section>
              </Box>

              {/* Section 6: Core Features */}
              <Box asChild className="scroll-mt-24">
                <section
                  id="features"
                  data-section-id="features"
                  {...Zenith.section("features")}
                  className={Zenith.cn(
                    Zenith.section("features").className,
                    "bg-primary/5 rounded-3xl p-8 border border-primary/10"
                  )}
                >
                  <HomeFeatures />
                </section>
              </Box>
            </FramerMotion>
          )}
        </main>

        {/* 4. Floating In-Content Overflow Scroll Anchor Bar */}
        <HomeContentAnchorBar />
      </Box>
    </>
  );
}

export default Home;
