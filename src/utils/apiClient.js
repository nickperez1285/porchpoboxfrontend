import { auth } from "../firebase";
import API_BASE_URL from "../config/api";

export const getAuthHeaders = async (extraHeaders = {}) => {
  const headers = { ...extraHeaders };
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const apiPost = async (path, body, { requireAuth = true } = {}) => {
  const headers = await getAuthHeaders({
    "Content-Type": "application/json",
  });

  if (requireAuth && !headers.Authorization) {
    throw new Error("You must be signed in to perform this action.");
  }

  return fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
};

export const apiGet = async (path, { requireAuth = true } = {}) => {
  const headers = await getAuthHeaders();

  if (requireAuth && !headers.Authorization) {
    throw new Error("You must be signed in to perform this action.");
  }

  return fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers,
  });
};

export { API_BASE_URL };
