export const API_BASE =
  process.env.REACT_APP_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "");
