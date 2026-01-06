function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function getBackendBaseUrl(): string | null {
  const raw =
    process.env.API_BASE_URL ||
    process.env.BACKEND_URL ||
    // Back-compat: some setups may expose this name.
    process.env.VITE_API_BASE_URL ||
    "";
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return normalizeBaseUrl(trimmed);
}

function getJoinedPath(pathParam: string | string[] | undefined): string {
  if (Array.isArray(pathParam)) return pathParam.filter(Boolean).join("/");
  return pathParam || "";
}

function stripHopByHopHeaders(
  headers: Record<string, string | string[] | undefined>
) {
  const hopByHop = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "host",
  ]);

  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (hopByHop.has(key.toLowerCase())) continue;
    if (typeof value === "undefined") continue;
    out[key] = Array.isArray(value) ? value.join(",") : value;
  }
  return out;
}

export default async function handler(req: any, res: any) {
  const backendBaseUrl = getBackendBaseUrl();
  if (!backendBaseUrl) {
    res
      .status(500)
      .json({ message: "Missing VITE_API_BASE_URL (backend origin)" });
    return;
  }

  const joined = getJoinedPath(req.query.path);

  // Preserve querystring from the incoming request.
  const incomingUrl = new URL(req.url || "/", "http://local.invalid");
  const targetUrl = new URL(`/api/${joined}`, backendBaseUrl);
  targetUrl.search = incomingUrl.search;

  const method = (req.method || "GET").toUpperCase();

  const headers = stripHopByHopHeaders(req.headers);

  let body: any;
  if (method !== "GET" && method !== "HEAD") {
    if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
      body = req.body as any;
    } else if (req.body != null) {
      body = JSON.stringify(req.body);
      if (!headers["content-type"]) {
        headers["content-type"] = "application/json";
      }
    }
  }

  // Let fetch compute correct content-length.
  delete headers["content-length"];

  const upstream = await fetch(targetUrl.toString(), {
    method,
    headers,
    body: body as any,
    redirect: "manual",
  });

  res.status(upstream.status);

  // Forward headers (including set-cookie).
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "content-encoding") return;
    if (lower === "content-length") return;
    if (lower === "transfer-encoding") return;
    res.setHeader(key, value);
  });

  const arrayBuffer = await upstream.arrayBuffer();
  res.send(Buffer.from(arrayBuffer));
}
