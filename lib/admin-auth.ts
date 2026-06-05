const SESSION_KEY = "fc26_admin";
const PASSWORD_KEY = "fc26_admin_pw";

export function getAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

export function setAdminSession(password: string): void {
  sessionStorage.setItem(SESSION_KEY, "true");
  sessionStorage.setItem(PASSWORD_KEY, password);
}

export function getAdminPassword(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(PASSWORD_KEY) ?? "";
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(PASSWORD_KEY);
}
