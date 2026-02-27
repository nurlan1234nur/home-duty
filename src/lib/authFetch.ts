import { getAuthToken } from "./authToken";

export function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(init.headers || undefined);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, { ...init, credentials: "include", headers });
}
