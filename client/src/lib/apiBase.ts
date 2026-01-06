export function getApiBaseUrl(): string {
  // Optional: route API requests through the same-origin Vercel frontend using a
  // Vercel rewrite from /api/* -> <azure-backend>/api/*.
  // This avoids cross-site requests (and storage/cookie restrictions) without
  // changing behavior unless explicitly enabled.
  const useVercelProxy =
    String(
      (import.meta.env as any).VITE_USE_VERCEL_API_PROXY ?? ""
    ).toLowerCase() === "true";
  if (useVercelProxy) {
    return "";
  }

  const raw =
    import.meta.env.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL;

  if (raw && typeof raw === "string") {
    return raw.replace(/\/$/, "");
  }

  // Never default to localhost in production builds.
  // Returning an empty string makes callers hit relative URLs like "/api/...".
  if (import.meta.env.PROD) {
    return "";
  }

  return "http://localhost:4000";
}
