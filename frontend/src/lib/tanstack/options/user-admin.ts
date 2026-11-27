import { keepPreviousData, queryOptions, type MutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import {
  changeUserRole,
  getRoleOptions,
  getUserDetail,
  getUserList,
  lockUser,
  unlockUser
} from "@/lib/axios/user-admin";
import type { ErrorResponse } from "@/lib/types/common";
import type { UserAdminItem, UserAdminListParams } from "@/lib/types/user-admin";

export const USER_ADMIN_LIST_KEY = ["user-admin-list"] as const;
export const USER_ADMIN_GET_KEY = ["user-admin-get"] as const;
export const USER_ADMIN_ROLE_OPTIONS_KEY = ["user-admin-role-options"] as const;

export const createUserListQueryOptions = (params: UserAdminListParams) =>
  queryOptions({
    queryKey: [...USER_ADMIN_LIST_KEY, params],
    queryFn: () => getUserList(params),
    placeholderData: keepPreviousData
  });

export const createUserDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: [...USER_ADMIN_GET_KEY, id],
    queryFn: () => getUserDetail(id),
    // 404 không cần thử lại
    retry: false
  });

export const roleOptionsQueryOptions = queryOptions({
  queryKey: USER_ADMIN_ROLE_OPTIONS_KEY,
  queryFn: getRoleOptions,
  staleTime: 60_000
});

const INVALIDATE = [USER_ADMIN_LIST_KEY, USER_ADMIN_GET_KEY];

type UserMutation<V> = MutationOptions<UserAdminItem, AxiosError<ErrorResponse>, V>;

export const lockUserMutationOptions: UserMutation<number> = {
  mutationKey: ["user-admin", "lock"],
  mutationFn: lockUser,
  meta: {
    invalidatesQuery: INVALIDATE,
    successMessage: (data) => `Đã khoá tài khoản ${(data as UserAdminItem).name}`,
    errorMessage: "Không khoá được tài khoản"
  }
};

export const unlockUserMutationOptions: UserMutation<number> = {
  mutationKey: ["user-admin", "unlock"],
  mutationFn: unlockUser,
  meta: {
    invalidatesQuery: INVALIDATE,
    successMessage: (data) => `Đã mở khoá tài khoản ${(data as UserAdminItem).name}`,
    errorMessage: "Không mở khoá được tài khoản"
  }
};

export const changeUserRoleMutationOptions: UserMutation<{ id: number; roleId: number }> = {
  mutationKey: ["user-admin", "change-role"],
  mutationFn: ({ id, roleId }) => changeUserRole(id, roleId),
  meta: {
    invalidatesQuery: INVALIDATE,
    successMessage: (data) => {
      const u = data as UserAdminItem;
      return `Đã đổi chức vụ của ${u.name} thành ${u.roleName}`;
    },
    errorMessage: "Không đổi được chức vụ"
  }
};
