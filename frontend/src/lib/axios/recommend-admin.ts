import axiosInstance from "@/lib/axios/instance";
import type { ApiResponse } from "@/lib/types/common";
import type {
  CustomerOptionDTO,
  EvalListParams,
  EvalListResponseDTO,
  RebuildResultDTO,
  RecEvalRunDTO,
  RecommendConfigDTO,
  RecommendStatsDTO,
  RecommendStatsParams,
  TryProfileRequest,
  TryProfileResultDTO
} from "@/lib/types/recommend";

/** GET /recommend/config — xem cấu hình và trạng thái chỉ mục (plan §5.1) */
export async function getRecommendConfig(): Promise<RecommendConfigDTO> {
  const res = await axiosInstance.get<ApiResponse<RecommendConfigDTO>>("/recommend/config");
  return res.data.result;
}

/** POST /recommend/rebuild — tính lại chỉ mục gợi ý (plan §5.2) */
export async function rebuildRecommendIndex(): Promise<RebuildResultDTO> {
  const res = await axiosInstance.post<ApiResponse<RebuildResultDTO>>("/recommend/rebuild");
  return res.data.result;
}

/** GET /recommend/stats?from=&to= — số liệu trực tuyến (plan §5.3) */
export async function getRecommendStats(params?: RecommendStatsParams): Promise<RecommendStatsDTO> {
  const queryParams: Record<string, string> = {};
  if (params?.from?.trim()) queryParams.from = params.from.trim();
  if (params?.to?.trim()) queryParams.to = params.to.trim();

  const res = await axiosInstance.get<ApiResponse<RecommendStatsDTO>>("/recommend/stats", {
    params: Object.keys(queryParams).length > 0 ? queryParams : undefined
  });
  return res.data.result;
}

/** GET /recommend/customers?keyword=&limit= — tìm khách để thử hồ sơ (plan §5.4) */
export async function searchRecommendCustomers(
  keyword?: string,
  limit?: number
): Promise<CustomerOptionDTO[]> {
  const params: Record<string, unknown> = {};
  if (keyword?.trim()) params.keyword = keyword.trim();
  if (limit !== undefined && limit > 0) params.limit = limit;

  const res = await axiosInstance.get<ApiResponse<CustomerOptionDTO[]>>("/recommend/customers", {
    params: Object.keys(params).length > 0 ? params : undefined
  });
  return res.data.result;
}

/** POST /recommend/try-profile — thử tính hồ sơ và xếp hạng gợi ý (plan §5.5) */
export async function tryProfile(payload: TryProfileRequest): Promise<TryProfileResultDTO> {
  const res = await axiosInstance.post<ApiResponse<TryProfileResultDTO>>("/recommend/try-profile", payload);
  return res.data.result;
}

/** GET /recommend/eval/list?algorithm=&batch=&page=&limit= — danh sách lần chạy đánh giá (plan §5.1) */
export async function listEvalRuns(params: EvalListParams = {}): Promise<EvalListResponseDTO> {
  const queryParams: Record<string, unknown> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20
  };
  if (params.algorithm?.trim()) queryParams.algorithm = params.algorithm.trim();
  if (params.batch?.trim()) queryParams.batch = params.batch.trim();

  const res = await axiosInstance.get<ApiResponse<EvalListResponseDTO>>("/recommend/eval/list", {
    params: queryParams
  });
  return res.data.result;
}

/** GET /recommend/eval/get?id= — chi tiết lần chạy đánh giá (plan §5.2) */
export async function getEvalRun(id: number): Promise<RecEvalRunDTO> {
  const res = await axiosInstance.get<ApiResponse<RecEvalRunDTO>>("/recommend/eval/get", {
    params: { id }
  });
  return res.data.result;
}

