export function getApiBaseUrl(): string {
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
