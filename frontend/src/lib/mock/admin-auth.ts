const SESSION_KEY = "incident-desk-admin-session";

const DEMO_CREDENTIALS = { email: "priya@example.com", password: "incidentdesk123" };

export interface AdminSession {
  name: string;
  email: string;
}

// Stands in for POST /api/admin/auth/login/ (Django session auth) until the backend exists.
export async function adminLogin(email: string, password: string): Promise<AdminSession> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== DEMO_CREDENTIALS.email || password !== DEMO_CREDENTIALS.password) {
    throw new Error("Incorrect email or password.");
  }
  const session: AdminSession = { name: "Priya N.", email: normalizedEmail };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

// Stands in for POST /api/admin/auth/logout/ until the backend exists.
export function adminLogout(): void {
  window.localStorage.removeItem(SESSION_KEY);
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch (error) {
    console.error("[adminAuth] failed to read session from storage", error);
    return null;
  }
}
