import type { ResourceApiDTO, ResourceDTO } from "@/lib/types/resource";

/** Một dòng của ma trận phân quyền: tài nguyên + action đã cấp cho chức vụ đang xem. */
export interface ResourceInfoDTO extends ResourceDTO {
  permission: { actions: string[] };
}

/** Shape thật của `GET /permission/role?roleId=`: tài nguyên + `grantedActions` (chuỗi JSON). */
export type ResourceInfoApiDTO = ResourceApiDTO & { grantedActions: string | null };

/** Một phần tử body `POST /permission/update`: đặt lại đúng danh sách action của cặp (chức vụ, tài nguyên). */
export interface PermissionUpdateItem {
  roleId: number;
  resourceId: number;
  /** Rỗng = gỡ hết quyền trên tài nguyên này */
  actions: string[];
}
