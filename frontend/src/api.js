export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

export function getToken() {
  return localStorage.getItem("token");
}

export async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "API-Fehler");
  }

  return data;
}