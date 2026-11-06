import type { PagedResult } from "@/lib/types/common";
import type { PagingDTO } from "@/lib/types/paging";

/** Bảng `module`: nhóm tài nguyên để hiển thị ma trận phân quyền. */
export interface ModuleDTO {
  id: number;
  name: string;
  code: string;
  description: string | null;
  /** 1 = kích hoạt, 0 = tắt */
  active: number;
}

/** `GET /module/list` */
export interface ModuleListApiRequest {
  keyword?: string;
  paging?: PagingDTO;
}

export type ModuleListResponseDTO = PagedResult<ModuleDTO>;

/** Body `POST /module/update`: không có `id` = tạo. */
export type ModuleUpsertApiRequest = Partial<Omit<ModuleDTO, "id">> & { id?: number };
