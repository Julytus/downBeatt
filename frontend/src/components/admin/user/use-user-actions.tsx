import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { ChangeRoleDialog } from "@/components/admin/user/change-role-dialog";
import { LockUserDialog } from "@/components/admin/user/lock-user-dialog";
import {
  changeUserRoleMutationOptions,
  lockUserMutationOptions,
  roleOptionsQueryOptions,
  unlockUserMutationOptions
} from "@/lib/tanstack/options/user-admin";
import type { UserAdminItem } from "@/lib/types/user-admin";

/**
 * Khoá / mở khoá / đổi chức vụ dùng chung cho trang danh sách và trang chi tiết.
 * Toast + làm mới dữ liệu nằm ở `meta` của mutation; ở đây chỉ đóng hộp thoại.
 */
export function useUserActions({ meIsOperator }: { meIsOperator: boolean }) {
  const [locking, setLocking] = React.useState<UserAdminItem | null>(null);
  const [changing, setChanging] = React.useState<UserAdminItem | null>(null);

  const { data: roles = [] } = useQuery(roleOptionsQueryOptions);

  const lockMutation = useMutation({ ...lockUserMutationOptions, onSuccess: () => setLocking(null) });
  const { mutate: unlock } = useMutation(unlockUserMutationOptions);
  const roleMutation = useMutation({ ...changeUserRoleMutationOptions, onSuccess: () => setChanging(null) });

  const onLock = React.useCallback((user: UserAdminItem) => setLocking(user), []);
  const onChangeRole = React.useCallback((user: UserAdminItem) => setChanging(user), []);
  const onUnlock = React.useCallback((user: UserAdminItem) => unlock(user.id), [unlock]);

  const dialogs = (
    <>
      <LockUserDialog
        user={locking}
        isLoading={lockMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setLocking(null);
        }}
        onConfirm={(user) => lockMutation.mutate(user.id)}
      />
      <ChangeRoleDialog
        user={changing}
        roles={roles}
        meIsOperator={meIsOperator}
        isLoading={roleMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setChanging(null);
        }}
        onSubmit={(user, roleId) => roleMutation.mutate({ id: user.id, roleId })}
      />
    </>
  );

  return { roles, onLock, onUnlock, onChangeRole, dialogs };
}
