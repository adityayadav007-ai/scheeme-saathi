import { useQuery } from "@tanstack/react-query";
import { matchSchemes } from "../services/api.js";

export function matchQueryKey(answers) {
  return ["match", answers];
}

export function useMatchSchemes(answers, options = {}) {
  return useQuery({
    queryKey: matchQueryKey(answers),
    queryFn: () => matchSchemes(answers),
    enabled: Boolean(answers),
    ...options
  });
}
