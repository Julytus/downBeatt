import axiosInstance from "@/lib/axios/instance";
import type { ApiResponse } from "@/lib/types/common";
import type {
  RoleDTO,
  RoleListApiRequest,
  RoleListResponseDTO,
  RoleUpsertApiRequest
} from "@/lib/types/role";

export async function getRoleList(req: RoleListApiRequest = {}): Promise<RoleListResponseDTO> {
  const params: Record<string, unknown> = {
    page: req.paging?.page ?? 1,
    limit: req.paging?.limit ?? 10
  };
  if (req.keyword?.trim()) params.keyword = req.keyword.trim();

  const res = await axiosInstance.get<ApiResponse<RoleListResponseDTO>>("/role/list", { params });
  return res.data.result;
}

export async function upsertRole(payload: RoleUpsertApiRequest): Promise<RoleDTO> {
  const res = await axiosInstance.post<ApiResponse<RoleDTO>>("/role/update", payload);
  return res.data.result;
}

export async function deleteRole(id: number): Promise<number> {
  const res = await axiosInstance.post<ApiResponse<number>>(`/role/delete/${id}`);
  return res.data.result;
}
