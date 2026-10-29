import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { AppPaths } from "@shell/paths";

import { Zenith } from "@shared/theme";

import { FramerMotion } from "@libs/react-motion";

export function HomeNavGrid() {
  const { t } = useTranslation("screens/dashboard");

  const cards = [
    {
      to: AppPaths.Showcase.Auth,
      title: t("navGrid.auth.title"),
      desc: t("navGrid.auth.desc"),
    },
    {
      to: AppPaths.Showcase.Employee,
      title: t("navGrid.employee.title"),
      desc: t("navGrid.employee.desc"),
    },
    {
      to: AppPaths.Showcase.Wizard,
      title: t("navGrid.wizard.title"),
      desc: t("navGrid.wizard.desc"),
    },
    {
      to: AppPaths.Builder,
      title: t("navGrid.builder.title"),
      desc: t("navGrid.builder.desc"),
    },
    {
      to: AppPaths.Showcase.Branch,
      title: t("navGrid.branch.title"),
      desc: t("navGrid.branch.desc"),
    },
    {
      to: AppPaths.About,
      title: t("navGrid.docs.title"),
      desc: t("navGrid.docs.desc"),
    },
  ];

  return (
    <div className={Zenith.patterns.layout.intrinsic.autoFit + " py-12"}>
      {cards.map((card, idx) => {
        const cardProps = Zenith.card({
          variant: "glass",
          hover: true,
          density: "adaptive",
          id: `feature-${idx}`,
        });
        return (
          <FramerMotion
            key={card.title}
            variant="swipeLeft"
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: idx * 0.1 }}
            className="h-full"
          >
            <NavLink
              to={card.to}
              className="group no-underline block h-full relative outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[2rem]"
            >
              <div
                {...cardProps}
                className={Zenith.cn(
                  cardProps.className,
                  "h-full relative overflow-hidden transition-all duration-700 group-hover:shadow-[0_30px_60px_-15px_var(--color-primary)] rounded-[2rem] border-white/5 dark:border-white/10"
                )}
              >
                {/* 1000000x Hover Gradient Injection */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative z-10 p-2">
                  {/* Geometric Icon */}
                  <div className="w-16 h-16 rounded-[1.25rem] bg-primary/10 border border-primary/20 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-700 shadow-inner">
                    <div
                      className="w-5 h-5 bg-primary rounded-full shadow-[0_0_20px_var(--color-primary)] animate-staggered-pulse"
                      style={{ "--stagger-idx": idx } as React.CSSProperties}
                    />
                  </div>

                  <h3
                    className={Zenith.cn(
                      Zenith.text("h2"),
                      "mb-4 group-hover:text-primary transition-colors duration-500 relative z-10"
                    )}
                  >
                    {card.title}
                  </h3>
                  <p
                    className={Zenith.cn(
                      Zenith.text("body"),
                      "opacity-60 group-hover:opacity-90 transition-opacity duration-500 relative z-10 leading-relaxed max-w-[90%]"
                    )}
                  >
                    {card.desc}
                  </p>
                </div>

                {/* Interactive Arrow - Premium Placement */}
                <div className="absolute bottom-8 right-8 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-700 flex items-center justify-center text-primary font-black text-2xl">
                  →
                </div>
              </div>
            </NavLink>
          </FramerMotion>
        );
      })}
    </div>
  );
}
