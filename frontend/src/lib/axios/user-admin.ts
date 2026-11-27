import axiosInstance from "@/lib/axios/instance";
import type { ApiResponse } from "@/lib/types/common";
import type {
  RoleOption,
  UserAdminDetail,
  UserAdminItem,
  UserAdminListParams,
  UserAdminListResponse
} from "@/lib/types/user-admin";

export async function getUserList(req: UserAdminListParams = {}): Promise<UserAdminListResponse> {
  const params: Record<string, unknown> = { page: req.page ?? 1, limit: req.limit ?? 10 };
  if (req.keyword?.trim()) params.keyword = req.keyword.trim();
  if (req.roleId) params.roleId = req.roleId;
  if (req.planCode) params.planCode = req.planCode;
  if (req.status) params.status = req.status;
  const res = await axiosInstance.get<ApiResponse<UserAdminListResponse>>("/user/list", { params });
  return res.data.result;
}

export async function getUserDetail(id: number): Promise<UserAdminDetail> {
  const res = await axiosInstance.get<ApiResponse<UserAdminDetail>>("/user/get", { params: { id } });
  return res.data.result;
}

export async function lockUser(id: number): Promise<UserAdminItem> {
  const res = await axiosInstance.post<ApiResponse<UserAdminItem>>(`/user/lock/${id}`);
  return res.data.result;
}

export async function unlockUser(id: number): Promise<UserAdminItem> {
  const res = await axiosInstance.post<ApiResponse<UserAdminItem>>(`/user/unlock/${id}`);
  return res.data.result;
}

export async function changeUserRole(id: number, roleId: number): Promise<UserAdminItem> {
  const res = await axiosInstance.post<ApiResponse<UserAdminItem>>("/user/change-role", { id, roleId });
  return res.data.result;
}

export async function getRoleOptions(): Promise<RoleOption[]> {
  const res = await axiosInstance.get<ApiResponse<RoleOption[]>>("/user/role-options");
  return res.data.result;
}
