import type { BlockKey, EvalMetricSetDTO, RecommendStrategy } from "@/lib/types/recommend";

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

export function formatParamValue(value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") {
    if (Number.isInteger(value)) return String(value);
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 4 }).format(value);
  }
  return String(value);
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

export function formatDateTimeShort(isoString?: string | null): string {
  if (!isoString) return "—";
  const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (match) {
    const [, y, m, d, hh, mm] = match;
    return `${d}/${m}/${y} ${hh}:${mm}`;
  }
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/* ==================== Đánh giá gợi ý (plan §6) ==================== */

export const EVAL_ALGORITHMS = [
  "random",
  "popular",
  "popular-dd",
  "cbf-tag",
  "cbf-full"
] as const;

export type EvalAlgorithm = (typeof EVAL_ALGORITHMS)[number];

export const EVAL_ALGORITHM_LABELS: Record<string, string> = {
  random: "B1 Ngẫu nhiên",
  popular: "B2 Phổ biến",
  "popular-dd": "B2-dd Phổ biến xen kẽ",
  "cbf-tag": "B3 CBF chỉ thẻ",
  "cbf-full": "M CBF đủ đặc trưng"
};

export type EvalMetricKey = keyof EvalMetricSetDTO;

export interface EvalMetricDef {
  key: EvalMetricKey;
  header: (k: number | string) => string;
  digits: number;
  tooltip: string;
}

export const EVAL_METRICS: EvalMetricDef[] = [
  {
    key: "precision",
    header: (k) => `P@${k}`,
    digits: 4,
    tooltip: "Tỉ lệ gợi ý đúng trong K gợi ý đầu"
  },
  {
    key: "recall",
    header: (k) => `R@${k}`,
    digits: 4,
    tooltip: "Tỉ lệ LUT liên quan được gợi ý trong K gợi ý đầu"
  },
  {
    key: "ndcg",
    header: (k) => `NDCG@${k}`,
    digits: 4,
    tooltip: "Chất lượng thứ hạng: gợi ý đúng càng ở trên càng tốt"
  },
  {
    key: "hitRate",
    header: (k) => `HitRate@${k}`,
    digits: 4,
    tooltip: "Tỉ lệ người dùng có ít nhất một gợi ý đúng"
  },
  {
    key: "ild",
    header: (k) => `ILD@${k}`,
    digits: 4,
    tooltip: "Độ khác nhau về màu giữa các LUT trong danh sách"
  },
  {
    key: "styles",
    header: (k) => `Phong cách / ${k}`,
    digits: 2,
    tooltip: "Số phong cách khác nhau trong danh sách"
  },
  {
    key: "coverage",
    header: (k) => `Coverage@${k}`,
    digits: 4,
    tooltip: "Tỉ lệ LUT của kho từng được gợi ý cho ít nhất một người"
  },
  {
    key: "novelty",
    header: (k) => `Novelty@${k}`,
    digits: 2,
    tooltip: "Mức ít phổ biến của các LUT được gợi ý"
  }
];

export function formatMetricValue(value: number, digits: number): string {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

export function formatSignedDiff(diff: number, digits: number): string {
  const r = Math.round(diff * 10 ** digits) / 10 ** digits;
  if (r > 0) return `+${formatMetricValue(r, digits)}`;
  if (r < 0) return `-${formatMetricValue(Math.abs(r), digits)}`;
  return formatMetricValue(0, digits);
}

export function formatSignedPercentChange(a: number, b: number): string {
  if (a === 0) return "—";
  const pct = ((b - a) / a) * 100;
  const r = Math.round(pct * 10) / 10;
  const body = formatMetricValue(Math.abs(r), 1);
  if (r > 0) return `+${body}%`;
  if (r < 0) return `-${body}%`;
  return `${body}%`;
}

export function flattenParams(
  obj: Record<string, unknown>,
  prefix = ""
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key === "elapsedMs") continue;
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      Object.assign(
        result,
        flattenParams(val as Record<string, unknown>, fullKey)
      );
    } else {
      result[fullKey] = val;
    }
  }
  return result;
}

export function areParamValuesDifferent(a: unknown, b: unknown): boolean {
  if (a === undefined && b === undefined) return false;
  if (a === undefined || b === undefined) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return true;
    return a.some((val, idx) => val !== b[idx]);
  }
  return a !== b;
}

