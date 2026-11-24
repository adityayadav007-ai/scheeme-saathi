import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { matchSchemes } from "../services/api.js";

export function matchQueryKey(answers, language = "en") {
  return ["match", answers, language];
}

export function useMatchSchemes(answers, options = {}) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || "en";

  return useQuery({
    queryKey: matchQueryKey(answers, language),
    queryFn: () => matchSchemes(answers, language),
    enabled: Boolean(answers),
    ...options
  });
}
