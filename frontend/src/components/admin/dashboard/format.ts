import { formatVnd } from "@/lib/utils/money";

export const formatCount = (x: number) => new Intl.NumberFormat("vi-VN").format(x);

export const formatPercent = (x: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(x);

export const formatPercentSigned = (x: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: "exceptZero"
  }).format(x);

export const formatCompact = (x: number) =>
  new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(x);

export const formatDateDMY = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  if (parts.length === 2) return `${parts[1]}/${parts[0]}`;
  return dateStr;
};

export const formatPeriodLabel = (period: string) => {
  if (!period) return "";
  const parts = period.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  if (parts.length === 2) return `Tháng ${parts[1]}/${parts[0]}`;
  return period;
};

export interface ComparisonResult {
  text: string;
  type: "positive" | "negative" | "neutral";
}

export const getComparison = (cur: number, prev: number): ComparisonResult => {
  if (prev === 0) {
    return { text: "Kỳ trước: 0", type: "neutral" };
  }
  if (cur === prev) {
    return { text: "Bằng kỳ trước", type: "neutral" };
  }
  const pct = (cur - prev) / prev;
  return {
    text: `${formatPercentSigned(pct)} so với kỳ trước`,
    type: pct > 0 ? "positive" : "negative"
  };
};

export { formatVnd };
