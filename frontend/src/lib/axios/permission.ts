import axiosInstance from "@/lib/axios/instance";
import { parseActions } from "@/lib/axios/resource";
import type { ApiResponse } from "@/lib/types/common";
import type {
  PermissionUpdateItem,
  ResourceInfoApiDTO,
  ResourceInfoDTO
} from "@/lib/types/permission";

export async function getRolePermissions(roleId: number): Promise<ResourceInfoDTO[]> {
  const res = await axiosInstance.get<ApiResponse<ResourceInfoApiDTO[]>>("/permission/role", {
    params: { roleId }
  });
  return (res.data.result ?? []).map(({ grantedActions, actions, ...rest }) => ({
    ...rest,
    actions: parseActions(actions),
    permission: { actions: parseActions(grantedActions) }
  }));
}

/** Trả số cặp (chức vụ, tài nguyên) đã đổi. */
export async function updatePermissions(items: PermissionUpdateItem[]): Promise<number> {
  const body = items.map((item) => ({ ...item, actions: JSON.stringify(item.actions) }));
  const res = await axiosInstance.post<ApiResponse<number>>("/permission/update", body);
  return res.data.result;
}
