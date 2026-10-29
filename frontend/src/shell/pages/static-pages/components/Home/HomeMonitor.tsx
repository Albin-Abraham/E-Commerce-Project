import { useTranslation } from "react-i18next";
import { Zenith } from "@shared/theme";

import { FramerMotion } from "@libs/react-motion";

interface HomeMonitorProps {
  isSuccess: boolean;
  isLoading: boolean;
  isError: boolean;
  data: any;
}

export function HomeMonitor({
  isSuccess,
  isLoading,
  isError,
  data,
}: HomeMonitorProps) {
  const { t } = useTranslation("screens/dashboard");

  return (
    <div {...Zenith.container()}>
      <FramerMotion
        variant="swipeLeft"
        viewport={{ once: true }}
        {...Zenith.card({ density: "spacious", id: "infra-monitor" })}
        className={Zenith.cn(
          Zenith.card({ density: "spacious" }).className,
          "backdrop-blur-sm mb-24"
        )}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-left">
            <h2 className={Zenith.cn(Zenith.text("h2"), "mb-4")}>
              {t("monitor.title")}
            </h2>
            <div className="space-y-3">
              <div className={Zenith.patterns.widgets.status}>
                <div
                  className={`${Zenith.patterns.widgets.indicator} ${isSuccess ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                />
                <span>
                  {isSuccess
                    ? t("monitor.operationalStatus")
                    : t("monitor.impairedStatus")}
                </span>
              </div>
              <p className="text-muted-foreground">
                {t("monitor.description")}
              </p>
            </div>
          </div>

          <div className={Zenith.patterns.widgets.display + " w-full max-w-sm"}>
            {isLoading && (
              <div className={Zenith.patterns.data.sync}>
                <span className="animate-bounce">●</span>
                <span>{t("monitor.syncing")}</span>
              </div>
            )}
            {isError && (
              <p className={Zenith.patterns.data.error}>
                ⚠ {t("monitor.networkOutage")}
              </p>
            )}
            {isSuccess && (
              <div className="space-y-2">
                <p className={Zenith.patterns.data.label}>{t("monitor.systemPayload")}</p>
                <div className={Zenith.patterns.data.snippet}>
                  {data?.title || t("monitor.noData")}
                </div>
              </div>
            )}
          </div>
        </div>
      </FramerMotion>
    </div>
  );
}
