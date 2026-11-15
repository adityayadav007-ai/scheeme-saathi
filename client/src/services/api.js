import axios from "axios";
import { normalizeApiBaseUrl } from "./apiBaseUrl.js";

const baseURL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_URL,
  import.meta.env.DEV
);

if (!import.meta.env.PROD) {
  console.info("Scheme Saathi API baseURL:", baseURL);
}

const api = axios.create({
  baseURL,
  timeout: 12_000,
  headers: { "Content-Type": "application/json" }
});

export async function getSchemes(params = {}) {
  const { data } = await api.get("/schemes", { params });
  return data;
}

export async function getScheme(slug) {
  const { data } = await api.get(`/schemes/${encodeURIComponent(slug)}`);
  return data.data;
}

export async function matchSchemes(answers) {
  const { data } = await api.post("/match", answers);
  return data;
}
