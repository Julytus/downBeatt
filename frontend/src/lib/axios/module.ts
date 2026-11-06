import axiosInstance from "@/lib/axios/instance";
import type { ApiResponse } from "@/lib/types/common";
import type {
  ModuleDTO,
  ModuleListApiRequest,
  ModuleListResponseDTO,
  ModuleUpsertApiRequest
} from "@/lib/types/module";

export async function getModuleList(req: ModuleListApiRequest = {}): Promise<ModuleListResponseDTO> {
  const params: Record<string, unknown> = {
    page: req.paging?.page ?? 1,
    limit: req.paging?.limit ?? 10
  };
  if (req.keyword?.trim()) params.keyword = req.keyword.trim();

  const res = await axiosInstance.get<ApiResponse<ModuleListResponseDTO>>("/module/list", { params });
  return res.data.result;
}

export async function upsertModule(payload: ModuleUpsertApiRequest): Promise<ModuleDTO> {
  const res = await axiosInstance.post<ApiResponse<ModuleDTO>>("/module/update", payload);
  return res.data.result;
}

export async function deleteModule(id: number): Promise<number> {
  const res = await axiosInstance.post<ApiResponse<number>>(`/module/delete/${id}`);
  return res.data.result;
}

/** Gán các tài nguyên vào module; trả số tài nguyên đã gán. */
export async function assignModuleResources(moduleId: number, resourceIds: number[]): Promise<number> {
  const res = await axiosInstance.post<ApiResponse<number>>(
    `/module/assign-resources/${moduleId}`,
    resourceIds
  );
  return res.data.result;
}
