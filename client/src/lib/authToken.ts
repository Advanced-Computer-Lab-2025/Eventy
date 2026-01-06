import { safeGetItem, safeRemoveItem, safeSetItem } from "@/lib/safeStorage";

let inMemoryToken: string | null = null;

export function getAuthToken(): string | null {
  return inMemoryToken || safeGetItem("token");
}

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
  if (token) {
    safeSetItem("token", token);
  } else {
    safeRemoveItem("token");
  }
}

export function clearAuthToken(): void {
  setAuthToken(null);
  safeRemoveItem("user");
}
