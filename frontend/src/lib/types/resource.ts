import type { PagedResult } from "@/lib/types/common";
import type { PagingDTO } from "@/lib/types/paging";

/** Action chuẩn của một tài nguyên (khớp tham số `checkPermission` ở backend). */
export const RESOURCE_ACTIONS = ["VIEW", "ADD", "UPDATE", "DELETE"] as const;

/**
 * Resource của chính các trang phân quyền: backend không cho xoá, không cho đổi code / uri
 * (đổi là tự khoá trang tương ứng với mọi chức vụ không toàn quyền).
 */
export const SYSTEM_RESOURCE_CODES = ["MODULE", "RESOURCE", "ROLE", "PERMISSION"];

/** Bảng `resource`; `actions` đã đổi từ chuỗi JSON sang mảng ở `lib/axios/resource.ts`. */
export interface ResourceDTO {
  id: number;
  name: string;
  description: string | null;
  code: string;
  /** Khớp hằng URI của controller, ví dụ "/lut/" */
  uri: string;
  actions: string[];
  active: number;
  moduleId: number | null;
}

/** Shape thật của backend: `actions` là chuỗi JSON, ví dụ `["VIEW", "ADD"]`. */
export type ResourceApiDTO = Omit<ResourceDTO, "actions"> & { actions: string | null };

/** `GET /resource/list` */
export interface ResourceListApiRequest {
  keyword?: string;
  moduleId?: number;
  /** true = chỉ tài nguyên chưa thuộc module nào */
  unassigned?: boolean;
  paging?: PagingDTO;
}

export type ResourceListResponseDTO = PagedResult<ResourceDTO>;

/** Body `POST /resource/update` (FE dùng mảng `actions`, axios đổi sang chuỗi JSON). */
export type ResourceUpsertApiRequest = Partial<Omit<ResourceDTO, "id">> & { id?: number };
