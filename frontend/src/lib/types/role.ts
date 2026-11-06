import type { PagedResult } from "@/lib/types/common";
import type { PagingDTO } from "@/lib/types/paging";

/** Bảng `role` (chức vụ). */
export interface RoleDTO {
  id: number;
  name: string;
  /** 1 = gán tự động cho tài khoản mới (chỉ một chức vụ) */
  isDefault: number;
  /** 1 = toàn quyền, bỏ qua bảng permission */
  isOperator: number;
}

/** `GET /role/list` */
export interface RoleListApiRequest {
  keyword?: string;
  paging?: PagingDTO;
}

export type RoleListResponseDTO = PagedResult<RoleDTO>;

/** Body `POST /role/update`: không có `id` = tạo. */
export type RoleUpsertApiRequest = Partial<Omit<RoleDTO, "id">> & { id?: number };
