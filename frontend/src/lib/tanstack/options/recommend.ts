import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { clearRecommendHistory, dismissLut, getForYou } from "@/lib/axios/recommend";

export const createForYouQueryOptions = (viewerKey: string) =>
  queryOptions({
    queryKey: ["recommend", "for-you", viewerKey],
    queryFn: () => getForYou(12),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 1
  });

export const dismissLutMutationOptions = mutationOptions({
  mutationKey: ["recommend", "dismiss"],
  mutationFn: ({ lutId, impressionId }: { lutId: number; impressionId?: number }) =>
    dismissLut(lutId, impressionId),
  meta: {
    errorMessage: "Không ẩn được LUT, vui lòng thử lại"
  }
});

export const clearHistoryMutationOptions = mutationOptions({
  mutationKey: ["recommend", "clear-history"],
  mutationFn: (anonId?: string) => clearRecommendHistory(anonId),
  meta: {
    successMessage: "Đã xoá lịch sử gợi ý",
    errorMessage: "Không xoá được, vui lòng thử lại",
    invalidatesQuery: [["recommend", "for-you"]]
  }
});
