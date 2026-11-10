import type { PagedResult } from "@/lib/types/common";
import type { LutStyle } from "@/lib/types/lut";
import type { PagingDTO } from "@/lib/types/paging";

export { type LutStyle, LUT_STYLE_LABEL, LUT_STYLES } from "@/lib/types/lut";

/** Đối tượng đặc trưng màu của LUT trả về từ API backend (§5) */
export interface LutColorFeatureDTO {
  lutId: number;
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  tint: number;
  shadowA: number;
  shadowB: number;
  highlightA: number;
  highlightB: number;
  /** 1 = đen trắng, 0 = màu */
  isMono: number;
  computedTime: string;
}

export type LutStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";

export const LUT_STATUS_LABEL: Record<LutStatus, string> = {
  DRAFT: "Nháp",
  PUBLISHED: "Đã xuất bản",
  HIDDEN: "Đã ẩn"
};

/** Phần tử danh sách LUT ở trang quản trị đặc trưng màu (§5.1, §5.2) */
export interface LutFeatureItemDTO {
  id: number;
  slug: string;
  title: string;
  creatorName?: string;
  style: LutStyle;
  status: LutStatus;
  coverUrl?: string;
  lutSize?: number | null;
  colorFeature?: LutColorFeatureDTO;
  featureError?: string;
}

/** Tham số lọc GET /lut/feature/list (§5.1) */
export interface LutFeatureListApiRequest {
  keyword?: string;
  style?: string;
  status?: string;
  hasFeature?: 0 | 1;
  paging?: PagingDTO;
}

export type LutFeatureListResponseDTO = PagedResult<LutFeatureItemDTO>;
