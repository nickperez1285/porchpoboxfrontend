const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001";

export const getApiUrl = (path) => {
  const normalizedBase = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

export default API_BASE_URL;
