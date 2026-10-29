import { createRoot } from "react-dom/client";
import { printZenOSFrontendBanner } from "./core/banner";

printZenOSFrontendBanner();

// Critical Path Failure Styles
import "@i18n/i18n";

import "@shared/styles/error-boundary.css";

import "./App.css";
import "./index.css";
import App from "./shell/App";
import { Providers } from "./shell/Providers";

const rootElement = document.getElementById("root");
const errorElement = document.getElementById("error");

if (!rootElement) {
  throw new Error(
    "Critical Failure: Application Root [id='root'] missing from DOM."
  );
}

try {
  createRoot(rootElement).render(
    <Providers>
      <App />
    </Providers>
  );
} catch (error) {
  console.error("FATAL: Zenith Kernel Boot Failure", error);

  if (errorElement) {
    errorElement.classList.remove("zenith-error-hidden");
    errorElement.classList.add("zenith-error-visible");
  }
}
