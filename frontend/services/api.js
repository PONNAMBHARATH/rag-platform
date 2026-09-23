import { getAccessToken } from "./auth.service";

const API_URL = import.meta.env.VITE_API_URL;

export const checkHealth = async () => {
  const response = await fetch(`${API_URL}/api/health`);

  if (!response.ok) {
    throw new Error("Backend health check failed");
  }

  return response.json();
};

export const getProtectedProfile = async () => {
  return apiRequest("/api/protected/profile");
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = await getAccessToken();

  if (!token) {
    throw new Error("User is not authenticated");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.message || "API request failed"
    );
  }

  return response.json();
};