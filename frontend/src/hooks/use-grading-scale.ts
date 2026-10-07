import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { gradingScaleService } from "@/services/grading-scale.service";

const GRADING_SCALE_KEY = "grading-scale";

export function useGradingScale(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [GRADING_SCALE_KEY],
    queryFn: () => gradingScaleService.get(),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

export function useUpdateGradingScale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (maxGradePoint: number) =>
      gradingScaleService.update(maxGradePoint),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [GRADING_SCALE_KEY] }),
  });
}
