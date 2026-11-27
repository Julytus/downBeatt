import { type ColumnDef } from "@tanstack/react-table";

import { UserActionsMenu, type UserActionHandlers } from "@/components/admin/user/user-actions-menu";
import { UserPlanBadge } from "@/components/admin/user/user-plan-badge";
import { UserStatusBadge } from "@/components/admin/user/user-status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { UserAdminItem } from "@/lib/types/user-admin";
import { formatPlanDate } from "@/lib/utils/plan";
import { canManageUser, isSelf, type CurrentAdmin } from "@/lib/utils/user-admin";

export const initialsOf = (name?: string) =>
  (name ?? "?")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

export const createUserColumns = ({
  me,
  canUpdate,
  ...handlers
}: {
  me: CurrentAdmin | null | undefined;
  canUpdate: boolean;
} & UserActionHandlers): ColumnDef<UserAdminItem>[] => [
  {
    accessorKey: "name",
    header: "Tài khoản",
    enableHiding: false,
    cell: ({ row }) => {
      const u = row.original;
      return (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-9">
            {u.avatar && <AvatarImage src={u.avatar} alt="" />}
            <AvatarFallback className="text-xs font-medium">{initialsOf(u.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-foreground font-semibold">{u.name}</span>
              {isSelf(me, u.id) && <Badge variant="secondary">Bạn</Badge>}
            </div>
            <div className="text-muted-foreground truncate text-sm">{u.email}</div>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "phone",
    header: "Số điện thoại",
    cell: ({ row }) => row.original.phone || "—"
  },
  {
    accessorKey: "roleName",
    header: "Chức vụ",
    cell: ({ row }) => (
      <div className="flex flex-wrap items-center gap-2">
        <span>{row.original.roleName}</span>
        {row.original.isOperator === 1 && <Badge variant="outline">Toàn quyền</Badge>}
      </div>
    )
  },
  {
    accessorKey: "planName",
    header: "Gói",
    cell: ({ row }) => <UserPlanBadge user={row.original} />
  },
  {
    accessorKey: "regisDate",
    header: "Ngày đăng ký",
    cell: ({ row }) => formatPlanDate(row.original.regisDate)
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => <UserStatusBadge status={row.original.status} />
  },
  {
    id: "rowActions",
    header: () => <span className="sr-only">Thao tác</span>,
    enableHiding: false,
    cell: ({ row }) => (
      <UserActionsMenu
        user={row.original}
        canManage={canUpdate && canManageUser(me, row.original)}
        {...handlers}
      />
    )
  }
];
