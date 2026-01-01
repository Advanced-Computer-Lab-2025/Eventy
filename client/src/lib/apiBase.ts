export function getApiBaseUrl(): string {
  return (
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta as any).env?.VITE_API_URL ||
    "http://localhost:4000"
  );
}
