import { queryOptions, type MutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { isAxiosError } from "axios";
import {
  addCollectionItem,
  deleteCollection,
  getMyCollections,
  getCollection,
  removeCollectionItem,
  saveCollection
} from "@/lib/axios/collection";
import { getServerErrorCode, type ErrorResponse } from "@/lib/types/common";
import type {
  CollectionDTO,
  CollectionItemRequest,
  SaveCollectionRequest
} from "@/lib/types/collection";

export const COLLECTIONS_QUERY_KEY = ["collections"] as const;

export const myCollectionsQueryOptions = (lutId?: number) =>
  queryOptions({
    queryKey: [...COLLECTIONS_QUERY_KEY, "my", lutId ?? null],
    queryFn: () => getMyCollections(lutId)
  });

export const collectionQueryOptions = (id: number | string) =>
  queryOptions({
    queryKey: [...COLLECTIONS_QUERY_KEY, "detail", id],
    queryFn: () => getCollection(id),
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 404) return false;
      return failureCount < 3;
    }
  });

/**
 * Mutation lưu bộ sưu tập (tạo mới hoặc đổi tên).
 * - Tạo kèm lutId: toast "Đã tạo “{tên}” và lưu LUT" (plan §6.3)
 * - Tạo không lutId: toast "Đã tạo bộ sưu tập “{tên}”" (plan §6.5)
 * - Đổi tên (isEdit): toast "Đã đổi tên bộ sưu tập" (plan §6.5)
 * - COLLECTION_NAME_EXISTS: silentError = true để component tự hiển thị dưới ô nhập, không bật toast.
 */
export const createSaveCollectionMutationOptions = (options?: {
  isEdit?: boolean;
  hasLut?: boolean;
}): MutationOptions<CollectionDTO, AxiosError<ErrorResponse>, SaveCollectionRequest> => ({
  mutationKey: [...COLLECTIONS_QUERY_KEY, "save"],
  mutationFn: saveCollection,
  meta: {
    invalidatesQuery: [COLLECTIONS_QUERY_KEY],
    silentError: (err) => getServerErrorCode(err) === "COLLECTION_NAME_EXISTS",
    errorMessage: "Không lưu được, vui lòng thử lại",
    successMessage: (data: unknown) => {
      const coll = data as CollectionDTO;
      if (options?.isEdit) {
        return "Đã đổi tên bộ sưu tập";
      }
      if (options?.hasLut) {
        return `Đã tạo “${coll.name}” và lưu LUT`;
      }
      return `Đã tạo bộ sưu tập “${coll.name}”`;
    }
  }
});

/**
 * Mutation xoá bộ sưu tập.
 * Backend trả về id đã xoá; caller truyền `name` để toast "Đã xoá bộ sưu tập “{tên}”" (plan §6.6).
 */
export const createDeleteCollectionMutationOptions = (
  name?: string
): MutationOptions<number, AxiosError<ErrorResponse>, number> => ({
  mutationKey: [...COLLECTIONS_QUERY_KEY, "delete"],
  mutationFn: deleteCollection,
  meta: {
    invalidatesQuery: [COLLECTIONS_QUERY_KEY],
    errorMessage: "Không xoá được bộ sưu tập",
    successMessage: name ? `Đã xoá bộ sưu tập “${name}”` : "Đã xoá bộ sưu tập"
  }
});

/**
 * Mutation thêm LUT vào bộ sưu tập (tích).
 * Toast: "Đã lưu vào “{tên}”" (plan §6.3).
 * silentSuccess dùng cho trường hợp hoàn tác (đã có toast riêng).
 */
export const createAddCollectionItemMutationOptions = (options?: {
  silentSuccess?: boolean;
}): MutationOptions<CollectionDTO, AxiosError<ErrorResponse>, CollectionItemRequest> => ({
  mutationKey: [...COLLECTIONS_QUERY_KEY, "item-add"],
  mutationFn: addCollectionItem,
  meta: {
    invalidatesQuery: [COLLECTIONS_QUERY_KEY],
    errorMessage: "Không lưu được, vui lòng thử lại",
    ...(options?.silentSuccess
      ? {}
      : { successMessage: (data: unknown) => `Đã lưu vào “${(data as CollectionDTO).name}”` })
  }
});

export const addCollectionItemMutationOptions = createAddCollectionItemMutationOptions();

/**
 * Mutation bỏ LUT khỏi bộ sưu tập (bỏ tích).
 * Toast: "Đã bỏ khỏi “{tên}”" (plan §6.3).
 * silentSuccess dùng cho trang chi tiết (cần toast có nút Hoàn tác).
 */
export const createRemoveCollectionItemMutationOptions = (options?: {
  silentSuccess?: boolean;
}): MutationOptions<CollectionDTO, AxiosError<ErrorResponse>, CollectionItemRequest> => ({
  mutationKey: [...COLLECTIONS_QUERY_KEY, "item-remove"],
  mutationFn: removeCollectionItem,
  meta: {
    invalidatesQuery: [COLLECTIONS_QUERY_KEY],
    errorMessage: "Không lưu được, vui lòng thử lại",
    ...(options?.silentSuccess
      ? {}
      : { successMessage: (data: unknown) => `Đã bỏ khỏi “${(data as CollectionDTO).name}”` })
  }
});

export const removeCollectionItemMutationOptions = createRemoveCollectionItemMutationOptions();
