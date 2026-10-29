import { useTranslation } from "react-i18next";
import { Zenith } from "@shared/theme";

import { FramerMotion } from "@libs/react-motion";

export function HomeFeatures() {
  const { t } = useTranslation("screens/dashboard");
  const items = Array.from({ length: 8 }, (_, i) =>
    t("industrial.featureItem", { number: i + 1 })
  );

  return (
    <>
      <FramerMotion variant="fade" viewport={{ once: true }}>
        <h2
          className={
            Zenith.text("h2") +
            " text-center mb-12 uppercase tracking-widest opacity-40"
          }
        >
          {t("industrial.title")}
        </h2>
      </FramerMotion>
      <div className={Zenith.patterns.layout.intrinsic.autoFill}>
        {items.map((item, index) => {
          const cardProps = Zenith.card({
            density: "compact",
            hover: true,
            id: `feature-item-${index}`,
          });
          return (
            <FramerMotion
              key={index}
              variant="scale"
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              {...cardProps}
              className={Zenith.cn(
                cardProps.className,
                "text-center font-black text-xs uppercase tracking-tighter opacity-60 hover:opacity-100 cursor-default"
              )}
            >
              {item}
            </FramerMotion>
          );
        })}
      </div>
    </>
  );
}
