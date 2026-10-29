import { useTranslation } from "react-i18next";
import { Zenith } from "@shared/theme";

import { FramerMotion } from "@libs/react-motion";

export function HomeStats() {
  const { t } = useTranslation("screens/dashboard");

  const stats = [
    { label: t("stats.architecturePurity"), value: "100%" },
    { label: t("stats.bootLatency"), value: "0ms" },
    { label: t("stats.typeSafety"), value: "300%" },
  ];

  return (
    <div className="relative @container">
      <div className={Zenith.hero("container") + " !p-12 @3xl:!p-24"}>
        {/* Absolute Positioning: Floating Decorative Accents */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 dark:bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-secondary/30 dark:bg-secondary/10 rounded-full blur-[120px] pointer-events-none z-0" />

        {/* Architectural Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

        <div className="grid grid-cols-1 @4xl:grid-cols-3 gap-16 text-center relative z-10">
          {stats.map((stat, i) => (
            <FramerMotion
              key={i}
              variant="swipeBottom"
              transition={{ delay: i * 0.1 }}
              className="group relative p-12 rounded-3xl transition-all duration-700 hover:bg-white/5 hover:shadow-premium border border-transparent hover:border-white/10"
            >
              <div className="text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/40 group-hover:from-primary group-hover:to-secondary transition-all duration-1000">
                {stat.value}
              </div>
              <div className="text-sm uppercase font-black tracking-[0.3em] text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">
                {stat.label}
              </div>

              {/* Context-Aware Floating Element */}
              <div className="absolute top-6 right-6 w-14 h-14 bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl border border-[var(--glass-border)] shadow-floating flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110 group-hover:-translate-y-6 pointer-events-none">
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-ping shadow-[0_0_15px_var(--color-primary)]" />
                <div className="absolute w-2.5 h-2.5 bg-primary rounded-full" />
              </div>
            </FramerMotion>
          ))}
        </div>
      </div>
    </div>
  );
}
