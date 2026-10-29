import React from "react";
import { useTranslation } from "react-i18next";

import { Activity, BarChart3, Package, TrendingUp } from "lucide-react";

import { Zenith } from "@shared/theme";

const Sparkline: React.FC<{ color: string }> = ({ color }) => (
  <div className="flex items-end gap-1 h-8 mt-2 opacity-50">
    {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
      <div
        key={i}
        className="w-full rounded-full"
        style={{
          height: `${h}%`,
          backgroundColor: color,
          opacity: 0.3 + i * 0.1,
        }}
      />
    ))}
  </div>
);

const StatCard: React.FC<{
  title: string;
  value: string;
  trend: string;
  icon: any;
  color?: string;
}> = ({ title, value, trend, icon: Icon, color = "var(--color-primary)" }) => (
  <div
    className={
      Zenith.card({ variant: "glass", hover: true }).className +
      " !p-6 grid grid-rows-subgrid row-span-4 gap-0"
    }
  >
    <div className="flex justify-between items-start">
      <div className="p-2 bg-primary/10 rounded-lg">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
        {trend}
      </span>
    </div>
    <p className={Zenith.patterns.data.label + " mt-4 self-end"}>{title}</p>
    <h3 className={Zenith.text("h2") + " self-start"}>{value}</h3>
    <Sparkline color={color} />
  </div>
);

const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation("screens/products");

  return (
    <div className="space-y-8">
      <div
        {...Zenith.grid({ base: 1, md: 2, lg: 4 })}
        className={Zenith.cn(
          Zenith.grid({ base: 1, md: 2, lg: 4 }).className,
          "grid-rows-[auto_auto_auto_auto]"
        )}
      >
        <StatCard
          title={t("analytics.totalRevenue")}
          value="$1.2M"
          trend="+12.5%"
          icon={TrendingUp}
          color="var(--color-primary)"
        />
        <StatCard
          title={t("analytics.activeProducts")}
          value="842"
          trend="+4.3%"
          icon={Package}
          color="var(--color-secondary)"
        />
        <StatCard
          title={t("analytics.conversionRate")}
          value="3.2%"
          trend="+0.8%"
          icon={Activity}
          color="var(--color-accent)"
        />
        <StatCard
          title={t("analytics.marketShare")}
          value="18.5%"
          trend="+2.1%"
          icon={BarChart3}
          color="var(--color-primary)"
        />
      </div>

      <div {...Zenith.grid({ base: 1, lg: 12 })}>
        <div
          className={Zenith.cn(
            Zenith.card({ variant: "base" }).className,
            "lg:col-span-8 !p-8 h-80 flex items-center justify-center border-dashed relative overflow-hidden"
          )}
        >
          {/* Architectural Background Grid for Chart Area */}
          <div className="absolute inset-0 bg-architectural-grid opacity-5 pointer-events-none" />

          <div className="text-center opacity-40 relative z-10">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-primary" />
            <p className={Zenith.text("body")}>
              {t("analytics.engine")}{" "}
              <span className="text-primary font-bold">{t("analytics.offline")}</span>
            </p>
            <div className="mt-4 flex gap-2 justify-center">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="w-2 h-10 bg-primary/20 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          className={Zenith.cn(
            Zenith.glass("prominent"),
            "lg:col-span-4 !p-8 flex flex-col gap-6 rounded-3xl"
          )}
        >
          <h3 className={Zenith.text("h3")}>{t("analytics.topPerformers")}</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
                  #{i}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">
                    {t("analytics.variant", { id: i })}
                  </p>
                  <div className="w-full h-1 bg-muted rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${90 - i * 15}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono">$42k</span>
              </div>
            ))}
          </div>
          <button className={Zenith.button("outline") + " w-full mt-2"}>
            {t("analytics.viewReport")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
