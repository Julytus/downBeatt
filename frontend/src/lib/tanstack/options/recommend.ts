import { mutationOptions } from "@tanstack/react-query";
import { clearRecommendHistory } from "@/lib/axios/recommend";

export const clearHistoryMutationOptions = mutationOptions({
  mutationKey: ["recommend", "clear-history"],
  mutationFn: (anonId?: string) => clearRecommendHistory(anonId),
  meta: {
    successMessage: "Đã xoá lịch sử gợi ý",
    errorMessage: "Không xoá được, vui lòng thử lại"
  }
});
