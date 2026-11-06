import { queryOptions, type MutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { getRolePermissions, updatePermissions } from "@/lib/axios/permission";
import type { ErrorResponse } from "@/lib/types/common";
import type { PermissionUpdateItem } from "@/lib/types/permission";

export const PERMISSIONS_QUERY_KEY = ["permissions"] as const;

export const createRolePermissionsQueryOptions = (roleId: number) =>
  queryOptions({
    queryKey: [...PERMISSIONS_QUERY_KEY, "role", roleId],
    queryFn: () => getRolePermissions(roleId),
    enabled: roleId > 0
  });

export const updatePermissionsMutationOptions: MutationOptions<
  number,
  AxiosError<ErrorResponse>,
  PermissionUpdateItem[]
> = {
  mutationKey: [...PERMISSIONS_QUERY_KEY, "update"],
  mutationFn: updatePermissions,
  meta: {
    // Có thể đang sửa quyền của chính chức vụ mình: làm mới cả menu
    invalidatesQuery: [PERMISSIONS_QUERY_KEY, ["permission-resource"]],
    successMessage: "Cập nhật phân quyền thành công",
    errorMessage: "Không cập nhật được phân quyền"
  }
};
