import { keepPreviousData, queryOptions, type MutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { assignModuleResources, deleteModule, getModuleList, upsertModule } from "@/lib/axios/module";
import type { ErrorResponse } from "@/lib/types/common";
import type { ModuleDTO, ModuleListApiRequest, ModuleUpsertApiRequest } from "@/lib/types/module";
import { PERMISSIONS_QUERY_KEY } from "@/lib/tanstack/options/permission";
import { RESOURCES_QUERY_KEY } from "@/lib/tanstack/options/resource";

export const MODULES_QUERY_KEY = ["modules"] as const;

export const createModuleListQueryOptions = (req: ModuleListApiRequest) =>
  queryOptions({
    queryKey: [...MODULES_QUERY_KEY, "list", req],
    queryFn: () => getModuleList(req),
    placeholderData: keepPreviousData
  });

/** Mọi module (tối đa 200) để gom nhóm ma trận phân quyền. */
export const allModulesQueryOptions = queryOptions({
  queryKey: [...MODULES_QUERY_KEY, "all"],
  queryFn: () => getModuleList({ paging: { page: 1, limit: 200 } }),
  staleTime: 60_000
});

export const createUpsertModuleMutationOptions = (
  isEdit: boolean
): MutationOptions<ModuleDTO, AxiosError<ErrorResponse>, ModuleUpsertApiRequest> => ({
  mutationKey: [...MODULES_QUERY_KEY, "upsert"],
  mutationFn: upsertModule,
  meta: {
    invalidatesQuery: [MODULES_QUERY_KEY, PERMISSIONS_QUERY_KEY],
    successMessage: isEdit ? "Cập nhật module thành công" : "Tạo module thành công",
    errorMessage: "Không lưu được module"
  }
});

export const deleteModuleMutationOptions: MutationOptions<
  number,
  AxiosError<ErrorResponse>,
  number
> = {
  mutationKey: [...MODULES_QUERY_KEY, "delete"],
  mutationFn: deleteModule,
  meta: {
    invalidatesQuery: [MODULES_QUERY_KEY, RESOURCES_QUERY_KEY, PERMISSIONS_QUERY_KEY],
    successMessage: "Xóa module thành công",
    errorMessage: "Không xóa được module"
  }
};

export const assignModuleResourcesMutationOptions: MutationOptions<
  number,
  AxiosError<ErrorResponse>,
  { moduleId: number; resourceIds: number[] }
> = {
  mutationKey: [...MODULES_QUERY_KEY, "assign"],
  mutationFn: ({ moduleId, resourceIds }) => assignModuleResources(moduleId, resourceIds),
  meta: {
    invalidatesQuery: [RESOURCES_QUERY_KEY, PERMISSIONS_QUERY_KEY],
    successMessage: (count) => `Đã gán ${count as number} tài nguyên vào module`,
    errorMessage: "Không gán được tài nguyên"
  }
};
