import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  type MutationOptions
} from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { deleteResource, getResourceList, upsertResource } from "@/lib/axios/resource";
import type { ErrorResponse } from "@/lib/types/common";
import type {
  ResourceDTO,
  ResourceListApiRequest,
  ResourceListResponseDTO,
  ResourceUpsertApiRequest
} from "@/lib/types/resource";
import { PERMISSIONS_QUERY_KEY } from "@/lib/tanstack/options/permission";

export const RESOURCES_QUERY_KEY = ["resources"] as const;

/** Quyền của chính người đăng nhập (`useCanView`, sidebar) — đổi tài nguyên / quyền thì phải làm mới. */
const OWN_PERMISSION_KEY = ["permission-resource"] as const;

export const createResourceListQueryOptions = (req: ResourceListApiRequest) =>
  queryOptions({
    queryKey: [...RESOURCES_QUERY_KEY, "list", req],
    queryFn: () => getResourceList(req),
    placeholderData: keepPreviousData
  });

/** Danh sách "Tải thêm" (hộp thoại gán tài nguyên). `opts.paging.limit` = số mục mỗi lần tải. */
export const createInfiniteResourcesQueryOptions = ({ opts }: { opts: ResourceListApiRequest }) => {
  const limit = opts.paging?.limit ?? 10;
  return infiniteQueryOptions({
    queryKey: [...RESOURCES_QUERY_KEY, "infinite", opts, limit],
    queryFn: ({ pageParam }) => getResourceList({ ...opts, paging: { page: pageParam, limit } }),
    initialPageParam: 1,
    getNextPageParam: (last: ResourceListResponseDTO) =>
      last.page * limit < last.total ? last.page + 1 : undefined
  });
};

export const createUpsertResourceMutationOptions = (
  isEdit: boolean
): MutationOptions<ResourceDTO, AxiosError<ErrorResponse>, ResourceUpsertApiRequest> => ({
  mutationKey: [...RESOURCES_QUERY_KEY, "upsert"],
  mutationFn: upsertResource,
  meta: {
    invalidatesQuery: [RESOURCES_QUERY_KEY, PERMISSIONS_QUERY_KEY, OWN_PERMISSION_KEY],
    successMessage: isEdit ? "Cập nhật tài nguyên thành công" : "Tạo tài nguyên thành công",
    errorMessage: "Không lưu được tài nguyên"
  }
});

export const deleteResourceMutationOptions: MutationOptions<
  number,
  AxiosError<ErrorResponse>,
  number
> = {
  mutationKey: [...RESOURCES_QUERY_KEY, "delete"],
  mutationFn: deleteResource,
  meta: {
    invalidatesQuery: [RESOURCES_QUERY_KEY, PERMISSIONS_QUERY_KEY, OWN_PERMISSION_KEY],
    successMessage: "Xóa tài nguyên thành công",
    errorMessage: "Không xóa được tài nguyên"
  }
};
