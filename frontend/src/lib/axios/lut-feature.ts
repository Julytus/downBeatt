import axiosInstance from "@/lib/axios/instance";
import type { ApiResponse } from "@/lib/types/common";
import type {
  LutFeatureItemDTO,
  LutFeatureListApiRequest,
  LutFeatureListResponseDTO
} from "@/lib/types/lut-feature";

export async function getLutFeatureList(
  req: LutFeatureListApiRequest = {}
): Promise<LutFeatureListResponseDTO> {
  const params: Record<string, unknown> = {};

  if (req.paging?.page) params.page = req.paging.page;
  if (req.paging?.limit) params.limit = req.paging.limit;
  if (req.keyword?.trim()) params.keyword = req.keyword.trim();
  if (req.style?.trim()) params.style = req.style.trim();
  if (req.status?.trim()) params.status = req.status.trim();
  if (req.hasFeature !== undefined) params.hasFeature = req.hasFeature;

  const res = await axiosInstance.get<ApiResponse<LutFeatureListResponseDTO>>(
    "/lut/feature/list",
    { params }
  );
  return res.data.result;
}

export async function recomputeLutFeatures(ids: number[]): Promise<LutFeatureItemDTO[]> {
  const res = await axiosInstance.post<ApiResponse<LutFeatureItemDTO[]>>(
    "/lut/feature/recompute",
    ids
  );
  return res.data.result;
}
