import { useTranslation } from "react-i18next";
import { Zenith } from "@shared/theme";

import { FramerMotion } from "@libs/react-motion";

export function HomeTrust() {
  const { t } = useTranslation("screens/dashboard");
  const logos = ["ORACLE", "SAMSUNG", "monday.com", "segment", "stripe"];

  return (
    <div className={Zenith.trust("container")}>
      {/* Architectural Edge Masking for smooth fading */}
      <div className={Zenith.trust("edgeMaskLeft")} />
      <div className={Zenith.trust("edgeMaskRight")} />

      <p className={Zenith.trust("title")}>
        {t("trust.title")}
      </p>

      <div className={Zenith.trust("track")}>
        {logos.map((logo, i) => (
          <FramerMotion
            key={i}
            variant="fade"
            transition={{ delay: i * 0.1 }}
            className={Zenith.trust("logoWrapper")}
          >
            <div className={Zenith.trust("logoText")}>
              {logo}
              <div className={Zenith.trust("logoUnderline")} />
            </div>
          </FramerMotion>
        ))}
      </div>
    </div>
  );
}
