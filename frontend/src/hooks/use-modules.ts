import { useQuery } from "@tanstack/react-query";

import { moduleService } from "@/services/module.service";

/** Small, fixed, server-owned catalog (API_CONTRACT.md §4.6.1) — long staleTime since it changes far less often than institution data. */
export function useModuleCatalog() {
  return useQuery({
    queryKey: ["modules"],
    queryFn: () => moduleService.list(),
    staleTime: 5 * 60_000,
  });
}
