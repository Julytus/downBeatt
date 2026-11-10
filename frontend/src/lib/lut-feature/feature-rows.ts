export type FeatureRowKey =
  | "brightness"
  | "contrast"
  | "saturation"
  | "warmth"
  | "tint"
  | "shadowB"
  | "shadowA"
  | "highlightB"
  | "highlightA";

export interface FeatureRowConfig {
  key: FeatureRowKey;
  label: string;
  left: string;
  right: string;
  neutral: number;
  span: number;
  digits: number;
  signed: boolean;
}

/** 9 hàng đặc trưng màu theo plan §6 */
export const FEATURE_ROWS: FeatureRowConfig[] = [
  {
    key: "brightness",
    label: "Độ sáng",
    left: "Tối",
    right: "Sáng",
    neutral: 0,
    span: 0.15,
    digits: 2,
    signed: true
  },
  {
    key: "contrast",
    label: "Tương phản",
    left: "Dịu",
    right: "Gắt",
    neutral: 1,
    span: 0.5,
    digits: 2,
    signed: false
  },
  {
    key: "saturation",
    label: "Bão hoà",
    left: "Nhạt",
    right: "Rực",
    neutral: 1,
    span: 1,
    digits: 2,
    signed: false
  },
  {
    key: "warmth",
    label: "Nhiệt độ",
    left: "Lạnh",
    right: "Ấm",
    neutral: 0,
    span: 15,
    digits: 1,
    signed: true
  },
  {
    key: "tint",
    label: "Sắc độ",
    left: "Xanh lá",
    right: "Hồng",
    neutral: 0,
    span: 15,
    digits: 1,
    signed: true
  },
  {
    key: "shadowB",
    label: "Vùng tối — nhiệt độ",
    left: "Lạnh",
    right: "Ấm",
    neutral: 0,
    span: 30,
    digits: 1,
    signed: true
  },
  {
    key: "shadowA",
    label: "Vùng tối — sắc độ",
    left: "Xanh lá",
    right: "Hồng",
    neutral: 0,
    span: 30,
    digits: 1,
    signed: true
  },
  {
    key: "highlightB",
    label: "Vùng sáng — nhiệt độ",
    left: "Lạnh",
    right: "Ấm",
    neutral: 0,
    span: 30,
    digits: 1,
    signed: true
  },
  {
    key: "highlightA",
    label: "Vùng sáng — sắc độ",
    left: "Xanh lá",
    right: "Hồng",
    neutral: 0,
    span: 30,
    digits: 1,
    signed: true
  }
];

/** Định dạng số theo Intl vi-VN, làm tròn trước rồi xét dấu (0 thì không dấu: 0,00 / 0,0) */
export function formatFeatureValue(value: number, row: FeatureRowConfig): string {
  const factor = Math.pow(10, row.digits);
  const rounded = Math.round(value * factor) / factor;
  const isZero = rounded === 0 || Object.is(rounded, -0);
  const normalized = isZero ? 0 : rounded;

  const formatter = new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: row.digits,
    maximumFractionDigits: row.digits,
    useGrouping: false
  });

  const formattedAbs = formatter.format(Math.abs(normalized));
  if (normalized > 0 && row.signed) {
    return `+${formattedAbs}`;
  }
  if (normalized < 0) {
    return `-${formattedAbs}`;
  }
  return formattedAbs;
}

/** Tỉ lệ lệch so với tâm trong [-1, 1] */
export function featureRatio(value: number, row: FeatureRowConfig): number {
  if (row.span === 0) return 0;
  const rawRatio = (value - row.neutral) / row.span;
  return Math.max(-1, Math.min(1, rawRatio));
}

/** Map nhanh cấu hình theo key */
export const FEATURE_ROW_BY_KEY: Record<FeatureRowKey, FeatureRowConfig> = Object.fromEntries(
  FEATURE_ROWS.map((r) => [r.key, r])
) as Record<FeatureRowKey, FeatureRowConfig>;
