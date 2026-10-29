import React from "react";

import { Zenith } from "@shared/theme";

export const ModuleCrashState: React.FC = () => (
  <div className={Zenith.cn(Zenith.container().className, "py-12")}>
    <div
      className={
        Zenith.card({ variant: "glass" }).className +
        " !p-8 text-center max-w-2xl mx-auto border-destructive/20"
      }
    >
      <h2 className={Zenith.text("h2") + " text-destructive mb-2"}>
        Module Initialization Failed
      </h2>
      <p className={Zenith.text("body") + " mb-6"}>
        We encountered an error while loading this feature module. This might be
        due to a network interruption or a configuration mismatch.
      </p>
      <button
        onClick={() => window.location.reload()}
        className={Zenith.button("primary")}
      >
        Reload Platform
      </button>
    </div>
  </div>
);
