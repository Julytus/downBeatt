import { useQuery } from "@tanstack/react-query";

import { meQueryOptions, permissionResourceQueryOptions } from "@/lib/tanstack/options/auth";

/**
 * Hook kiểm tra quyền truy cập các resource trong hệ thống.
 * Quyền theo `code` resource của role đăng nhập (`/permission/resource`): `canView(code)` = VIEW,
 * `can(code, action)` cho action bất kỳ (ADD, UPDATE...).
 * Operator luôn được phép; query permission lỗi thì fail-open (BE vẫn chặn ở API).
 * `isPending` = chưa đủ dữ liệu để quyết định, caller không nên coi là "không có quyền".
 */
export function useCanView() {
  const { data: me, isPending: mePending } = useQuery(meQueryOptions);
  const {
    data: resources,
    isError,
    isPending: resourcesPending
  } = useQuery({ ...permissionResourceQueryOptions(), retry: 1 });

  const can = (code: string, action: string) =>
    me?.isOperator === 1 ||
    isError ||
    !!resources?.some((r) => r.code === code && r.actions.includes(action));
  const canView = (code: string) => can(code, "VIEW");

  return { canView, can, isPending: mePending || (resourcesPending && me?.isOperator !== 1) };
}
