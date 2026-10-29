import React from "react";
import { useTranslation } from "react-i18next";
import { Zenith } from "@shared/theme";
import { Info, Shield, Layers, Cpu } from "lucide-react";

export const About: React.FC = () => {
  const { t } = useTranslation("screens/staticPages");

  return (
    <div className="min-h-screen bg-architectural-grid p-6 sm:p-12 flex flex-col items-center justify-center relative">
      <div className="max-w-3xl w-full mx-auto space-y-8 relative z-10 animate-in fade-in duration-500">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-2 shadow-inner">
            <Info className="w-3.5 h-3.5" />
            <span>ZenOS Enterprise</span>
          </div>
          <h1 className={Zenith.text("h1") + " text-foreground tracking-tight"}>
            {t("about.title")}
          </h1>
          <p className={Zenith.text("body") + " text-muted-foreground max-w-xl mx-auto"}>
            {t("about.subtitle")}
          </p>
        </div>

        <div className={Zenith.card({ variant: "glass" }).className + " p-8 space-y-6 rounded-3xl"}>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20">
              <Shield className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-foreground">{t("about.mission")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("about.missionText")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/40">
            <div className="p-4 bg-surface rounded-2xl border border-border/40 flex items-center gap-3">
              <Layers className="w-5 h-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground uppercase font-black tracking-widest">{t("about.version")}</div>
                <div className="text-sm font-bold text-foreground">v2.4.0-industrial</div>
              </div>
            </div>
            <div className="p-4 bg-surface rounded-2xl border border-border/40 flex items-center gap-3">
              <Cpu className="w-5 h-5 text-secondary" />
              <div>
                <div className="text-xs text-muted-foreground uppercase font-black tracking-widest">Kernel Engine</div>
                <div className="text-sm font-bold text-foreground">Zenith Model-Driven Core</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
