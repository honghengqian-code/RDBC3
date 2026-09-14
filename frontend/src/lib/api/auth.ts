import { apiFetch, ApiError } from "@/lib/api/client";

export interface AdminSession {
  name: string;
  email: string;
}

// POST /api/admin/auth/login/
export async function adminLogin(email: string, password: string): Promise<AdminSession> {
  try {
    const data = await apiFetch<AdminSession>("/api/admin/auth/login/", {
      method: "POST",
      body: { email, password },
    });
    if (!data) throw new Error("Login returned no data.");
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw new Error("Incorrect email or password.");
    }
    throw error;
  }
}

// POST /api/admin/auth/logout/
export async function adminLogout(): Promise<void> {
  await apiFetch("/api/admin/auth/logout/", { method: "POST" });
}

// GET /api/admin/auth/session/ — the session cookie is httponly, so the only way to know
// whether we're logged in is to ask the server, not to read client-side state.
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    return await apiFetch<AdminSession>("/api/admin/auth/session/");
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    console.error("[getAdminSession] failed to check session", error);
    return null;
  }
}
