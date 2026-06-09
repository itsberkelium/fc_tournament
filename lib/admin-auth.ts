const SESSION_KEY = "fc26_admin";
const PASSWORD_KEY = "fc26_admin_pw";
const ROLE_KEY = "fc26_admin_role";

export type AdminRole = "admin" | "moderator";

export function getAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

export function setAdminSession(password: string, role: AdminRole): void {
  sessionStorage.setItem(SESSION_KEY, "true");
  sessionStorage.setItem(PASSWORD_KEY, password);
  sessionStorage.setItem(ROLE_KEY, role);
}

export function getAdminPassword(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(PASSWORD_KEY) ?? "";
}

export function getAdminRole(): AdminRole {
  if (typeof window === "undefined") return "moderator";
  return (sessionStorage.getItem(ROLE_KEY) as AdminRole) ?? "moderator";
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(PASSWORD_KEY);
  sessionStorage.removeItem(ROLE_KEY);
}
