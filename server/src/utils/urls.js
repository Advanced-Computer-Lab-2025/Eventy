const isProduction = process.env.NODE_ENV === "production";

const DEV_FRONTEND_BASE_URL = "http://localhost:5000";
const DEV_BACKEND_BASE_URL = "http://localhost:4000";

function normalizeBaseUrl(value) {
  return String(value).trim().replace(/\/+$/, "");
}

function firstFromEnv(value) {
  if (!value) return null;
  const first = String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)[0];
  return first ? normalizeBaseUrl(first) : null;
}

export function getFrontendBaseUrl() {
  return (
    firstFromEnv(process.env.CLIENT_URL) ||
    (!isProduction ? DEV_FRONTEND_BASE_URL : null)
  );
}

export function getBackendBaseUrl() {
  return (
    // Optional: if you ever want the server to know its own public origin.
    // (Not required for the current deployment setup.)
    firstFromEnv(process.env.BACKEND_URL) ||
    (!isProduction ? DEV_BACKEND_BASE_URL : null)
  );
}

export function requireFrontendBaseUrl(purpose = "") {
  const url = getFrontendBaseUrl();
  if (!url) {
    const suffix = purpose ? ` (${purpose})` : "";
    throw new Error(`Missing frontend base URL${suffix}. Set CLIENT_URL.`);
  }
  return url;
}

export function requireBackendBaseUrl(purpose = "") {
  const url = getBackendBaseUrl();
  if (!url) {
    const suffix = purpose ? ` (${purpose})` : "";
    throw new Error(`Missing backend base URL${suffix}. Set BACKEND_URL.`);
  }
  return url;
}

function ensureLeadingSlash(pathname) {
  if (!pathname) return "";
  return String(pathname).startsWith("/") ? String(pathname) : `/${pathname}`;
}

export function buildFrontendUrl(pathname = "") {
  const base = getFrontendBaseUrl();
  if (!base) return null;
  return `${base}${ensureLeadingSlash(pathname)}`;
}

export function buildBackendUrl(pathname = "") {
  const base = getBackendBaseUrl();
  if (!base) return null;
  return `${base}${ensureLeadingSlash(pathname)}`;
}

export function rewriteLegacyLocalhostUrls(value) {
  if (typeof value !== "string" || value.length === 0) return value;

  const frontendBaseUrl = getFrontendBaseUrl();
  const backendBaseUrl = getBackendBaseUrl();

  let out = value;

  // Rewrite legacy API origins first.
  if (backendBaseUrl) {
    out = out
      .replaceAll("http://localhost:5000/api", `${backendBaseUrl}/api`)
      .replaceAll("http://localhost:4000/api", `${backendBaseUrl}/api`);
  }

  if (frontendBaseUrl) {
    out = out
      .replaceAll("http://localhost:5000", frontendBaseUrl)
      .replaceAll("http://localhost:5173", frontendBaseUrl)
      .replaceAll("http://localhost:3000", frontendBaseUrl);
  }

  if (backendBaseUrl) {
    out = out.replaceAll("http://localhost:4000", backendBaseUrl);
  }

  return out;
}
