// Sentry initialization should be imported first!
import "./instrument";

import { createRoot } from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { logger } from "@/lib/logger";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import "./index.css";
import "./styles/calendar.css";

(globalThis as typeof globalThis & { logger?: typeof logger }).logger = logger;

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <SpeedInsights />
    <Analytics />
  </>
);
