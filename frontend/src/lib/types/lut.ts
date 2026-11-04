import type { PagedResult } from "@/lib/types/common";
import type { PagingDTO } from "@/lib/types/paging";

export const LUT_STYLES = [
  "dien-anh",
  "co-dien",
  "phim-nhua",
  "den-trang",
  "teal-orange",
  "am-ap",
  "lanh",
  "du-lich"
] as const;
export type LutStyle = (typeof LUT_STYLES)[number];

export const LUT_STYLE_LABEL: Record<LutStyle, string> = {
  "dien-anh": "Điện ảnh",
  "co-dien": "Cổ điển",
  "phim-nhua": "Phim nhựa",
  "den-trang": "Đen trắng",
  "teal-orange": "Teal & Orange",
  "am-ap": "Ấm áp",
  lanh: "Lạnh",
  "du-lich": "Du lịch"
};

export const LUT_SORTS = ["relevance", "newest", "popular"] as const;
export type LutSort = (typeof LUT_SORTS)[number];

export const LUT_SORT_LABEL: Record<LutSort, string> = {
  relevance: "Liên quan",
  newest: "Mới nhất",
  popular: "Phổ biến nhất"
};

/** Phần mềm dựng phim đọc được file .cube */
export const LUT_SOFTWARE = ["Premiere Pro", "DaVinci Resolve", "Final Cut Pro", "CapCut"] as const;

/**
 * Cách xem trước ở trang chi tiết, quản trị chọn khi thêm / sửa LUT:
 * - before-after: thanh kéo so sánh ảnh trước / sau
 * - video: video đã áp LUT (thẻ ở lưới phát khi rê chuột)
 */
export const LUT_PREVIEW_TYPES = ["before-after", "video"] as const;
export type LutPreviewType = (typeof LUT_PREVIEW_TYPES)[number];

export const LUT_PREVIEW_TYPE_LABEL: Record<LutPreviewType, string> = {
  "before-after": "Ảnh trước / sau",
  video: "Video"
};

/** Kiểu chữ in trên ảnh bìa (chỉ dùng cho dữ liệu mẫu, khi có ảnh thật sẽ bỏ). */
export type LutCoverTextStyle = "bold" | "caption" | "serif" | "condensed" | "spaced" | "outline";

export interface LutDTO {
  id: string;
  /** Định danh trên URL: /luts/<slug> */
  slug: string;
  title: string;
  creator: string;
  description: string;
  style: LutStyle;
  /** slug các danh mục chứa LUT này */
  categories: string[];
  tags: string[];
  /** true = cần gói trả phí mới tải được (biểu tượng ngôi sao) */
  premium: boolean;
  downloads: number;
  fileSizeKb: number;
  coverUrl: string;
  previewType: LutPreviewType;
  /** Có khi previewType = "video" */
  previewVideoUrl?: string;
  /** Chữ in trên ảnh bìa */
  coverText?: string;
  coverTextStyle?: LutCoverTextStyle;
  /** CSS filter mô phỏng màu sau khi áp LUT (dữ liệu mẫu) */
  previewFilter: string;
  createdAt: string;
}

export interface LutListFilter {
  q?: string;
  keywords?: string[];
  styles?: LutStyle[];
  sort?: LutSort;
  /** slug danh mục (trang /luts/danh-muc/<slug>) */
  category?: string;
}

export type LutListApiRequest = LutListFilter & { paging?: PagingDTO };

export type LutListResponseDTO = PagedResult<LutDTO>;

export type LutCategoryGroup = "phong-cach" | "tong-mau" | "dip" | "phan-mem";

export const LUT_CATEGORY_GROUP_LABEL: Record<LutCategoryGroup, string> = {
  "phong-cach": "Phong cách",
  "tong-mau": "Tông màu",
  dip: "Dịp & chủ đề",
  "phan-mem": "Phần mềm"
};

export interface LutCategoryDTO {
  slug: string;
  name: string;
  group: LutCategoryGroup;
  /** Mô tả ngắn ở đầu trang danh mục */
  description: string;
  /** Hiện ở khối "Danh mục phổ biến" */
  popular?: boolean;
}
