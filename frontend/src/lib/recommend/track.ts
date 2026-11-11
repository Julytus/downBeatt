import { sendRecommendEvent } from "@/lib/axios/recommend";
import { getAnonId } from "@/lib/recommend/anon-id";
import type { RecommendEventType } from "@/lib/types/recommend";

/**
 * Gửi một sự kiện hành vi người dùng về backend (plan §6.1 / §8).
 * Chỗ duy nhất nuốt lỗi: thiết kế §9.3 yêu cầu gửi không chờ, lỗi bỏ qua (không toast, không retry, không ảnh hưởng trang).
 */
export function trackEvent(
  type: RecommendEventType,
  payload: { lutId?: number; value?: string | null; impressionId?: number | null } = {}
): void {
  void sendRecommendEvent({
    anonId: getAnonId(),
    type,
    lutId: payload.lutId,
    value: payload.value,
    impressionId: payload.impressionId
  }).catch(() => undefined);
}
