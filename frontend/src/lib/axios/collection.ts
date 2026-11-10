import axiosInstance from "@/lib/axios/instance";
import { toLutDTO } from "@/lib/axios/luts";
import type { ApiResponse } from "@/lib/types/common";
import type {
  CollectionApiDTO,
  CollectionDTO,
  CollectionItemRequest,
  SaveCollectionRequest
} from "@/lib/types/collection";

export function toCollectionDTO(api: CollectionApiDTO): CollectionDTO {
  return {
    id: api.id,
    name: api.name,
    itemCount: api.itemCount,
    coverUrls: api.coverUrls ?? [],
    containsLut: api.containsLut,
    luts: api.luts?.map(toLutDTO),
    createdTime: api.createdTime,
    updatedTime: api.updatedTime
  };
}

/** GET /collection/my-list?lutId= (plan §5.1) — các bộ sưu tập của người dùng */
export async function getMyCollections(lutId?: number): Promise<CollectionDTO[]> {
  const params: Record<string, unknown> = {};
  if (lutId != null) params.lutId = lutId;

  const res = await axiosInstance.get<ApiResponse<CollectionApiDTO[]>>("/collection/my-list", {
    params
  });
  return (res.data.result ?? []).map(toCollectionDTO);
}

/** GET /collection/get?id= (plan §5.2) — một bộ kèm danh sách LUT */
export async function getCollection(id: number | string): Promise<CollectionDTO> {
  const res = await axiosInstance.get<ApiResponse<CollectionApiDTO>>("/collection/get", {
    params: { id }
  });
  return toCollectionDTO(res.data.result);
}

/** POST /collection/update (plan §5.3) — tạo mới hoặc đổi tên bộ sưu tập */
export async function saveCollection(req: SaveCollectionRequest): Promise<CollectionDTO> {
  const res = await axiosInstance.post<ApiResponse<CollectionApiDTO>>("/collection/update", req);
  return toCollectionDTO(res.data.result);
}

/** POST /collection/delete/{id} (plan §5.4) — xoá bộ sưu tập */
export async function deleteCollection(id: number): Promise<number> {
  const res = await axiosInstance.post<ApiResponse<number>>(`/collection/delete/${id}`);
  return res.data.result;
}

/** POST /collection/item/add (plan §5.5) — lưu LUT vào bộ */
export async function addCollectionItem(req: CollectionItemRequest): Promise<CollectionDTO> {
  const res = await axiosInstance.post<ApiResponse<CollectionApiDTO>>("/collection/item/add", req);
  return toCollectionDTO(res.data.result);
}

/** POST /collection/item/remove (plan §5.6) — bỏ LUT khỏi bộ */
export async function removeCollectionItem(req: CollectionItemRequest): Promise<CollectionDTO> {
  const res = await axiosInstance.post<ApiResponse<CollectionApiDTO>>("/collection/item/remove", req);
  return toCollectionDTO(res.data.result);
}
