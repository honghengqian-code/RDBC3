/**
 * Thin fetch wrapper for the Django backend. Every request carries the
 * session cookie (`credentials: "include"`) and, for unsafe methods, an
 * `X-CSRFToken` header read from the `csrftoken` cookie DRF's
 * SessionAuthentication expects back — see CLAUDE.md 3.4 for why that
 * cookie exists and how it gets set.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const UNSAFE_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    const firstField = Object.values(record)[0];
    if (Array.isArray(firstField) && typeof firstField[0] === "string") return firstField[0];
  }
  return fallback;
}

export interface ApiFetchOptions {
  method?: string;
  body?: unknown;
}

/** Returns null on a 404 (the caller treats that as "not found", not an error); throws ApiError otherwise. */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T | null> {
  const method = options.method ?? "GET";
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {};
  // FormData bodies get no Content-Type here — the browser sets its own
  // multipart boundary, and overriding it breaks the upload.
  if (options.body !== undefined && !isFormData) headers["Content-Type"] = "application/json";
  if (UNSAFE_METHODS.has(method)) {
    const csrfToken = readCookie("csrftoken");
    if (csrfToken) headers["X-CSRFToken"] = csrfToken;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body:
        options.body === undefined ? undefined : isFormData ? (options.body as FormData) : JSON.stringify(options.body),
    });
  } catch (error) {
    console.error("[apiFetch] network error", { path, method, error });
    throw new ApiError(0, "Couldn't reach the server. Check your connection and try again.", null);
  }

  if (response.status === 404) return null;
  if (response.status === 204) return null;

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = extractErrorMessage(data, `Request failed (${response.status}).`);
    console.error("[apiFetch] request failed", { path, method, status: response.status, data });
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}
