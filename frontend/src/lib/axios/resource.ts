import axiosInstance from "@/lib/axios/instance";
import type { ApiResponse, PagedResult } from "@/lib/types/common";
import type {
  ResourceApiDTO,
  ResourceDTO,
  ResourceListApiRequest,
  ResourceListResponseDTO,
  ResourceUpsertApiRequest
} from "@/lib/types/resource";

/** Cột `actions` là JSON: backend trả chuỗi, ví dụ `["VIEW", "ADD"]`. */
export function parseActions(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((a): a is string => typeof a === "string") : [];
  } catch {
    return [];
  }
}

export const toResourceDTO = (api: ResourceApiDTO): ResourceDTO => ({
  ...api,
  actions: parseActions(api.actions)
});

export async function getResourceList(
  req: ResourceListApiRequest = {}
): Promise<ResourceListResponseDTO> {
  const params: Record<string, unknown> = {
    page: req.paging?.page ?? 1,
    limit: req.paging?.limit ?? 10
  };
  if (req.keyword?.trim()) params.keyword = req.keyword.trim();
  if (req.moduleId !== undefined) params.moduleId = req.moduleId;
  if (req.unassigned) params.unassigned = true;

  const res = await axiosInstance.get<ApiResponse<PagedResult<ResourceApiDTO>>>("/resource/list", {
    params
  });
  const data = res.data.result;
  return { total: data.total, page: data.page, items: data.items.map(toResourceDTO) };
}

export async function upsertResource(payload: ResourceUpsertApiRequest): Promise<ResourceDTO> {
  const { actions, ...rest } = payload;
  const body = actions === undefined ? rest : { ...rest, actions: JSON.stringify(actions) };
  const res = await axiosInstance.post<ApiResponse<ResourceApiDTO>>("/resource/update", body);
  return toResourceDTO(res.data.result);
}

export async function deleteResource(id: number): Promise<number> {
  const res = await axiosInstance.post<ApiResponse<number>>(`/resource/delete/${id}`);
  return res.data.result;
}
