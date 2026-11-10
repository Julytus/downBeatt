import type { LutApiDTO, LutDTO } from "@/lib/types/lut";

export const FREE_COLLECTION_LIMIT = 3;

/** Đối tượng Collection từ API backend (plan §5) */
export interface CollectionApiDTO {
  id: number;
  name: string;
  itemCount: number;
  coverUrls: string[];
  containsLut?: boolean;
  luts?: LutApiDTO[];
  createdTime: string;
  updatedTime: string;
}

/** Đối tượng Collection dùng ở client (đã chuyển luts sang LutDTO) */
export interface CollectionDTO {
  id: number;
  name: string;
  itemCount: number;
  coverUrls: string[];
  containsLut?: boolean;
  luts?: LutDTO[];
  createdTime: string;
  updatedTime: string;
}

/** Body POST /collection/update: tạo (không id) hoặc đổi tên (có id), có thể kèm lutId khi tạo */
export interface SaveCollectionRequest {
  id?: number;
  name: string;
  lutId?: number;
}

/** Body POST /collection/item/add hoặc remove */
export interface CollectionItemRequest {
  collectionId: number;
  lutId: number;
}
