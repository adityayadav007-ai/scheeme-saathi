import { useQuery } from "@tanstack/react-query";
import { getScheme, getSchemes } from "../services/api.js";

export function useSchemes(params, options = {}) {
  return useQuery({
    queryKey: ["schemes", params],
    queryFn: () => getSchemes(params),
    ...options
  });
}

export function useScheme(slug, options = {}) {
  return useQuery({
    queryKey: ["scheme", slug],
    queryFn: () => getScheme(slug),
    enabled: Boolean(slug),
    ...options
  });
}
