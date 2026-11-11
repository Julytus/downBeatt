import axiosInstance from "@/lib/axios/instance";
import { toLutDTO } from "@/lib/axios/luts";
import { getAnonId } from "@/lib/recommend/anon-id";
import type { ApiResponse } from "@/lib/types/common";
import type { LutApiDTO } from "@/lib/types/lut";
import type { ForYouDTO, RecommendEventRequest, RecommendStrategy } from "@/lib/types/recommend";

interface ForYouApiResponse {
  impressionId?: number;
  strategy: RecommendStrategy;
  items: (LutApiDTO & { reason?: string; score?: number })[];
}

/** POST /recommend/public/for-you (plan §5.1) — lấy danh sách gợi ý 12 LUT. */
export async function getForYou(limit = 12): Promise<ForYouDTO> {
  const res = await axiosInstance.post<ApiResponse<ForYouApiResponse>>("/recommend/public/for-you", {
    anonId: getAnonId(),
    limit
  });
  const data = res.data.result;
  return {
    impressionId: data.impressionId,
    strategy: data.strategy,
    items: (data.items ?? []).map((item) => ({
      ...toLutDTO(item),
      reason: item.reason,
      score: item.score
    }))
  };
}

/** POST /recommend/dismiss (plan §5.2) — "Không quan tâm" một LUT (cần token). */
export async function dismissLut(lutId: number, impressionId?: number): Promise<boolean> {
  const payload: { lutId: number; impressionId?: number } = { lutId };
  if (impressionId !== undefined) {
    payload.impressionId = impressionId;
  }
  const res = await axiosInstance.post<ApiResponse<boolean>>("/recommend/dismiss", payload);
  return res.data.result;
}

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
