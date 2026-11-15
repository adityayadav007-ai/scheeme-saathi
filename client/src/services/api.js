import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
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
