import { sendRecommendEvent } from "@/lib/axios/recommend";
import { getAnonId } from "@/lib/recommend/anon-id";
import type { RecommendEventType } from "@/lib/types/recommend";

interface PendingImpression {
  lutId: number;
  impressionId: number;
  expiresAt: number;
}

let pendingImpression: PendingImpression | null = null;

/**
 * Nhớ impressionId khi bấm vào một LUT trong khối gợi ý (plan §6.1 / §8).
 * Một mục duy nhất, hết hạn sau 60 giây.
 */
export function rememberImpression(lutId: number, impressionId?: number): void {
  if (impressionId === undefined || impressionId === null) return;
  pendingImpression = {
    lutId,
    impressionId,
    expiresAt: Date.now() + 60_000
  };
}

/**
 * Lấy impressionId của LUT để gắn vào sự kiện VIEW (lấy xong xoá ngay).
 */
export function takeImpression(lutId: number): number | undefined {
  if (!pendingImpression) return undefined;
  if (Date.now() > pendingImpression.expiresAt) {
    pendingImpression = null;
    return undefined;
  }
  if (pendingImpression.lutId !== lutId) {
    return undefined;
  }
  const id = pendingImpression.impressionId;
  pendingImpression = null;
  return id;
}

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
