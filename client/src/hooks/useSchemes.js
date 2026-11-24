import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getScheme, getSchemes } from "../services/api.js";

export function useSchemes(params, options = {}) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || "en";
  const localizedParams = { ...params, lang: language };

  return useQuery({
    queryKey: ["schemes", localizedParams],
    queryFn: () => getSchemes(localizedParams),
    ...options
  });
}

export function useScheme(slug, options = {}) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || "en";

  return useQuery({
    queryKey: ["scheme", slug, language],
    queryFn: () => getScheme(slug, language),
    enabled: Boolean(slug),
    ...options
  });
}
