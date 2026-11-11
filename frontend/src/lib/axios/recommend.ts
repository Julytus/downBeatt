import axiosInstance from "@/lib/axios/instance";
import type { ApiResponse } from "@/lib/types/common";
import type { RecommendEventRequest } from "@/lib/types/recommend";

/** POST /recommend/public/event (plan §5.3) — ghi nhận một hành vi người dùng. */
export async function sendRecommendEvent(req: RecommendEventRequest): Promise<boolean> {
  const res = await axiosInstance.post<ApiResponse<boolean>>("/recommend/public/event", req);
  return res.data.result;
}

/** POST /recommend/merge-anon (plan §5.5) — gộp hành vi ẩn danh vào tài khoản đã đăng nhập. */
export async function mergeAnon(anonId: string): Promise<number> {
  const res = await axiosInstance.post<ApiResponse<number>>("/recommend/merge-anon", { anonId });
  return res.data.result;
}

/** POST /recommend/clear-history (plan §5.6) — xoá lịch sử hành vi của người dùng. */
export async function clearRecommendHistory(anonId?: string): Promise<number> {
  const res = await axiosInstance.post<ApiResponse<number>>(
    "/recommend/clear-history",
    anonId ? { anonId } : {}
  );
  return res.data.result;
}
