export function normalizeApiBaseUrl(value, isDevelopment = import.meta.env.DEV) {
  let base = typeof value === "string" ? value.trim() : "";
  base = base.replace(/\/+$/, "");

  while (/\/api$/i.test(base)) {
    base = base.slice(0, -4).replace(/\/+$/, "");
  }

  if (!base && isDevelopment) {
    base = "http://127.0.0.1:5000";
  }

  return `${base}/api`;
}
