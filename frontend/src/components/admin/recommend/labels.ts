import type { BlockKey, RecommendStrategy } from "@/lib/types/recommend";

export const BLOCK_KEYS: BlockKey[] = [
  "tag",
  "color",
  "category",
  "style",
  "text",
  "creator"
];

export const BLOCK_LABELS: Record<BlockKey, string> = {
  tag: "Thẻ",
  color: "Màu",
  category: "Danh mục",
  style: "Phong cách",
  text: "Văn bản",
  creator: "Tác giả"
};

export const EVENT_KEYS = [
  "VIEW",
  "PREVIEW",
  "SEARCH",
  "FILTER_STYLE",
  "FAVORITE",
  "DOWNLOAD",
  "PURCHASE",
  "DISMISS"
] as const;

export const EVENT_LABELS: Record<string, string> = {
  VIEW: "Xem (VIEW)",
  PREVIEW: "Xem trước (PREVIEW)",
  SEARCH: "Tìm kiếm (SEARCH)",
  FILTER_STYLE: "Lọc phong cách (FILTER_STYLE)",
  FAVORITE: "Lưu bộ sưu tập (FAVORITE)",
  DOWNLOAD: "Tải (DOWNLOAD)",
  PURCHASE: "Mua gói (PURCHASE)",
  DISMISS: "Không quan tâm (DISMISS)"
};

export const PARAM_KEYS = [
  "similarity-top",
  "half-life-days",
  "history-days",
  "history-max-pairs",
  "cold-start-k",
  "mmr-lambda",
  "candidate-top",
  "premium-max-ratio",
  "related-personal-ratio",
  "popular-days",
  "for-you-limit",
  "for-you-max-limit",
  "event-dedup-minutes",
  "profile-cache-minutes",
  "preference-max",
  "stats-download-window-minutes",
  "stats-max-days",
  "rebuild-cron",
  "event-cleanup-cron"
] as const;

export const PARAM_LABELS: Record<string, string> = {
  "similarity-top": "Số LUT tương tự lưu cho mỗi LUT",
  "half-life-days": "Chu kỳ bán rã (ngày)",
  "history-days": "Số ngày lịch sử tối đa",
  "history-max-pairs": "Số cặp (LUT, loại) tối đa",
  "cold-start-k": "Hằng số k của α = k / (k + n)",
  "mmr-lambda": "λ của MMR (phù hợp ↔ đa dạng)",
  "candidate-top": "Số ứng viên đưa vào MMR",
  "premium-max-ratio": "Tỉ lệ LUT Premium tối đa (gói Miễn phí)",
  "related-personal-ratio": "Phần cá nhân hoá trong \"Có thể bạn cũng thích\"",
  "popular-days": "Số ngày tính \"phổ biến\"",
  "for-you-limit": "Số LUT mặc định của \"Dành cho bạn\"",
  "for-you-max-limit": "Số LUT tối đa của \"Dành cho bạn\"",
  "event-dedup-minutes": "Chống ghi lặp sự kiện (phút)",
  "profile-cache-minutes": "Thời gian cache hồ sơ (phút)",
  "preference-max": "Số sở thích khai báo tối đa",
  "stats-download-window-minutes": "Cửa sổ tính \"tải từ gợi ý\" (phút)",
  "stats-max-days": "Khoảng thống kê tối đa (ngày)",
  "rebuild-cron": "Lịch dựng lại chỉ mục",
  "event-cleanup-cron": "Lịch xoá sự kiện cũ"
};

export const STRATEGY_LABELS: Record<RecommendStrategy, string> = {
  PROFILE: "Theo hành vi",
  PREFERENCE: "Theo sở thích khai báo",
  POPULAR: "Chưa có tín hiệu (phổ biến)"
};

export const VARIANT_STRATEGY_LABELS: Record<string, string> = {
  PROFILE: "Dành cho bạn (hành vi)",
  PREFERENCE: "Dành cho bạn (sở thích)",
  POPULAR: "Phổ biến tuần này"
};

export function formatVnNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function formatVnPercent(value: number, digits = 1): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

export function formatVnDecimal(value: number, digits = 2): string {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

export function formatParamValue(value: number | string): string {
  if (typeof value === "string") return value;
  if (Number.isInteger(value)) return String(value);
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 4 }).format(value);
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return "—";
  const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    const [, y, m, d, hh, mm, ss] = match;
    return `${d}/${m}/${y} ${hh}:${mm}:${ss}`;
  }
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
