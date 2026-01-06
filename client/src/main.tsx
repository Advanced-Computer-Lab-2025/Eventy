import { createRoot } from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { logger } from "@/lib/logger";
import App from "./App";
import "./index.css";
import "./styles/calendar.css";

(globalThis as any).logger = logger;

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <SpeedInsights />
  </>
);
