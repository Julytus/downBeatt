import { isAxiosError } from "axios";
import axiosInstance from "@/lib/axios/instance";
import { getAnonId } from "@/lib/recommend/anon-id";
import type { LutDownloadDTO } from "@/lib/types/account";
import type { ApiResponse, PagedResult } from "@/lib/types/common";
import type {
  LutApiDTO,
  LutCategoryApiDTO,
  LutCategoryDTO,
  LutDTO,
  LutListApiRequest,
  LutListResponseDTO,
  LutStyle
} from "@/lib/types/lut";
import type { PagingDTO } from "@/lib/types/paging";

export function isNotFoundError(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 404;
}

export function toLutDTO(api: LutApiDTO): LutDTO {
  return {
    id: api.id,
    slug: api.slug,
    title: api.title,
    creator: api.creatorName,
    description: api.description,
    style: api.style as LutStyle,
    categories: api.categories ?? [],
    tags: api.tags ?? [],
    premium: api.isPremium === 1,
    downloads: api.downloadCount,
    fileSizeKb: api.fileSizeKb,
    lutSize: api.lutSize,
    coverUrl: api.coverUrl,
    previewType: api.previewType === "VIDEO" ? "video" : "before-after",
    beforeUrl: api.beforeUrl,
    afterUrl: api.afterUrl,
    previewVideoUrl: api.previewVideoUrl,
    createdAt: api.publishedTime
  };
}

export function toLutCategoryDTO(api: LutCategoryApiDTO): LutCategoryDTO {
  return {
    slug: api.slug,
    name: api.name,
    group: api.groupCode,
    description: api.description,
    popular: api.isPopular === 1
  };
}

export async function getLuts(req: LutListApiRequest = {}): Promise<LutListResponseDTO> {
  const params: Record<string, unknown> = {};
  if (req.q?.trim()) params.q = req.q.trim();
  if (req.keywords && req.keywords.length > 0) params.keywords = req.keywords;
  if (req.styles && req.styles.length > 0) params.styles = req.styles;
  if (req.category) params.category = req.category;
  if (req.sort) params.sort = req.sort;
  params.page = req.paging?.page ?? 1;
  params.limit = req.paging?.limit ?? 12;

  const res = await axiosInstance.get<ApiResponse<PagedResult<LutApiDTO>>>("/lut/public/list", {
    params,
    paramsSerializer: { indexes: null }
  });
  const data = res.data.result;
  return {
    total: data.total,
    page: data.page,
    items: data.items.map(toLutDTO)
  };
}

export async function getLut(slug: string): Promise<LutDTO> {
  const res = await axiosInstance.get<ApiResponse<LutApiDTO>>("/lut/public/get", {
    params: { slug }
  });
  return toLutDTO(res.data.result);
}

export async function getRelatedLuts(
  slug: string,
  paging: PagingDTO = {}
): Promise<LutListResponseDTO> {
  const params: Record<string, unknown> = {
    slug,
    page: paging.page ?? 1,
    limit: paging.limit ?? 12,
    anonId: getAnonId()
  };
  const res = await axiosInstance.get<ApiResponse<PagedResult<LutApiDTO>>>("/lut/public/related", {
    params
  });
  const data = res.data.result;
  return {
    total: data.total,
    page: data.page,
    items: data.items.map(toLutDTO)
  };
}

export async function getLutSuggestions(q: string, limit = 4): Promise<LutDTO[]> {
  const params: Record<string, unknown> = { limit };
  if (q.trim()) params.q = q.trim();

  const res = await axiosInstance.get<ApiResponse<LutApiDTO[]>>("/lut/public/suggest", {
    params
  });
  return (res.data.result ?? []).map(toLutDTO);
}

export async function getLutCategories(): Promise<LutCategoryDTO[]> {
  const res = await axiosInstance.get<ApiResponse<LutCategoryApiDTO[]>>("/lut-category/public/list");
  return (res.data.result ?? []).map(toLutCategoryDTO);
}

export async function getLutCategory(slug: string): Promise<LutCategoryDTO> {
  const res = await axiosInstance.get<ApiResponse<LutCategoryApiDTO>>("/lut-category/public/get", {
    params: { slug }
  });
  return toLutCategoryDTO(res.data.result);
}

/** POST /lut/download (plan §5.1) — xin URL ký sẵn để tải LUT. */
export async function requestLutDownload(lutId: number): Promise<LutDownloadDTO> {
  const res = await axiosInstance.post<ApiResponse<LutDownloadDTO>>("/lut/download", { lutId });
  return res.data.result;
}
