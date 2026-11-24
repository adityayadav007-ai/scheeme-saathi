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
  timeout: 45_000,
  headers: { "Content-Type": "application/json" }
});

const defaultPagination = {
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 1
};

function safeNumber(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : fallback;
}

export async function getSchemes(params = {}) {
  const response = await api.get("/schemes", { params });
  const payload = response?.data;
  const pagination = payload?.pagination;

  return {
    ...(payload && typeof payload === "object" ? payload : {}),
    data: Array.isArray(payload?.data) ? payload.data : [],
    pagination: {
      page: safeNumber(pagination?.page, defaultPagination.page),
      limit: safeNumber(pagination?.limit, defaultPagination.limit),
      total: safeNumber(pagination?.total, defaultPagination.total),
      totalPages: safeNumber(
        pagination?.totalPages,
        defaultPagination.totalPages
      )
    }
  };
}

export async function getScheme(slug, lang = "en") {
  const response = await api.get(`/schemes/${encodeURIComponent(slug)}`, {
    params: { lang }
  });
  return response?.data?.data ?? null;
}

export async function matchSchemes(answers, lang = "en") {
  const response = await api.post("/match", answers, { params: { lang } });
  const payload = response?.data;
  return {
    ...(payload && typeof payload === "object" ? payload : {}),
    eligible: Array.isArray(payload?.eligible) ? payload.eligible : [],
    partial: Array.isArray(payload?.partial) ? payload.partial : []
  };
}
