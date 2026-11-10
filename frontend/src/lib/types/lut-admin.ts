import type { PagedResult } from "@/lib/types/common";
import type { LutStyle } from "@/lib/types/lut";
import type { LutColorFeatureDTO, LutStatus } from "@/lib/types/lut-feature";
import type { PagingDTO } from "@/lib/types/paging";

export type { LutStatus, LutStyle };
export { LUT_STATUS_LABEL } from "@/lib/types/lut-feature";
export { LUT_STYLE_LABEL, LUT_STYLES } from "@/lib/types/lut";

/** Phần tử danh sách LUT ở trang quản trị /admin/luts (§5.1) */
export interface LutAdminItemDTO {
  id: number;
  slug: string;
  title: string;
  creatorName?: string;
  style: LutStyle;
  isPremium: number;
  status: LutStatus;
  downloadCount: number;
  publishedTime?: string;
  updatedTime?: string;
  coverUrl?: string;
}

/** Đối tượng LUT chi tiết ở trang quản trị /admin/luts/<id> (§5) */
export interface LutAdminDetailDTO {
  id: number;
  slug: string;
  title: string;
  description?: string;
  creatorId: number;
  creatorName?: string;
  style: LutStyle;
  isPremium: number;
  status: LutStatus;
  previewType: "BEFORE_AFTER" | "VIDEO";
  coverUrl?: string;
  beforeUrl?: string;
  afterUrl?: string;
  previewVideoUrl?: string;
  fileSizeKb?: number;
  lutSize?: number;
  downloadCount: number;
  publishedTime?: string;
  createdTime?: string;
  updatedTime?: string;
  tags: string[];
  categories: string[];
  colorFeature?: LutColorFeatureDTO;
}

/** Tham số query GET /lut/list (§5.1) */
export interface LutAdminListApiRequest {
  keyword?: string;
  status?: string;
  style?: string;
  paging?: PagingDTO;
}

export type LutAdminListResponseDTO = PagedResult<LutAdminItemDTO>;

/** Body POST /lut/update (tạo / sửa) (§5.3) */
export interface LutUpsertApiRequest {
  id?: number;
  title?: string;
  description?: string;
  creatorId?: number;
  style?: string;
  isPremium?: number;
  previewType?: "BEFORE_AFTER" | "VIDEO";
  tags?: string[];
  categories?: string[];
}

export type LutUploadKind = "CUBE" | "COVER" | "BEFORE" | "AFTER" | "VIDEO";

/** Đối tượng tác giả từ GET /lut/creators (§5.8) */
export interface CreatorOptionDTO {
  id: number;
  name: string;
  slug: string;
  status: number;
}

export interface LutUploadRule {
  kind: LutUploadKind;
  slotName: string;
  accept: string;
  allowedExtensions: string[];
  maxSizeBytes: number;
  maxSizeLabel: string;
  errorWrongExt: string;
  errorTooLarge: string;
  successToast: string;
}

export const LUT_UPLOAD_RULES: Record<LutUploadKind, LutUploadRule> = {
  CUBE: {
    kind: "CUBE",
    slotName: ".cube",
    accept: ".cube",
    allowedExtensions: [".cube"],
    maxSizeBytes: 10 * 1024 * 1024,
    maxSizeLabel: "10 MB",
    errorWrongExt: "Chỉ nhận file .cube",
    errorTooLarge: "File tối đa 10 MB",
    successToast: "Đã tải lên file .cube"
  },
  COVER: {
    kind: "COVER",
    slotName: "Ảnh bìa",
    accept: ".jpg,.jpeg,.png,.webp",
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    maxSizeBytes: 10 * 1024 * 1024,
    maxSizeLabel: "10 MB",
    errorWrongExt: "Chỉ nhận ảnh .jpg, .jpeg, .png, .webp",
    errorTooLarge: "File tối đa 10 MB",
    successToast: "Đã tải lên Ảnh bìa"
  },
  BEFORE: {
    kind: "BEFORE",
    slotName: "Ảnh trước",
    accept: ".jpg,.jpeg,.png,.webp",
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    maxSizeBytes: 10 * 1024 * 1024,
    maxSizeLabel: "10 MB",
    errorWrongExt: "Chỉ nhận ảnh .jpg, .jpeg, .png, .webp",
    errorTooLarge: "File tối đa 10 MB",
    successToast: "Đã tải lên Ảnh trước"
  },
  AFTER: {
    kind: "AFTER",
    slotName: "Ảnh sau",
    accept: ".jpg,.jpeg,.png,.webp",
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    maxSizeBytes: 10 * 1024 * 1024,
    maxSizeLabel: "10 MB",
    errorWrongExt: "Chỉ nhận ảnh .jpg, .jpeg, .png, .webp",
    errorTooLarge: "File tối đa 10 MB",
    successToast: "Đã tải lên Ảnh sau"
  },
  VIDEO: {
    kind: "VIDEO",
    slotName: "Video xem trước",
    accept: ".mp4,.webm",
    allowedExtensions: [".mp4", ".webm"],
    maxSizeBytes: 50 * 1024 * 1024,
    maxSizeLabel: "50 MB",
    errorWrongExt: "Chỉ nhận video .mp4, .webm",
    errorTooLarge: "File tối đa 50 MB",
    successToast: "Đã tải lên Video xem trước"
  }
};
