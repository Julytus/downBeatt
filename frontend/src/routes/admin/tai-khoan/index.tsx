import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { AdminListError } from "@/components/admin/admin-list-error";
import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { DataTableAdvanced } from "@/components/admin/table/data-table-advanced";
import type { TableSearchFilterField } from "@/components/admin/table/table-search-filter";
import { createUserColumns } from "@/components/admin/user/columns";
import { useUserActions } from "@/components/admin/user/use-user-actions";
import { useCanView } from "@/hooks/use-can-view";
import { meQueryOptions } from "@/lib/tanstack/options/auth";
import { createUserListQueryOptions } from "@/lib/tanstack/options/user-admin";
import type { UserAdminItem } from "@/lib/types/user-admin";

const RESOURCE_CODE = "USER";

export const Route = createFileRoute("/admin/tai-khoan/")({
  component: UserListRoute
});

function UserListRoute() {
  return (
    <AdminPermissionGuard code={RESOURCE_CODE}>
      <UserListPage />
    </AdminPermissionGuard>
  );
}

const EMPTY_FILTER = { keyword: "", roleId: "", planCode: "", status: "" };

function UserListPage() {
  const navigate = useNavigate();
  const { can } = useCanView();
  const canUpdate = can(RESOURCE_CODE, "UPDATE");
  const { data: me } = useQuery(meQueryOptions);
  const meIsOperator = me?.isOperator === 1;

  const [paging, setPaging] = useState({ pageIndex: 0, pageSize: 10 });
  const [filter, setFilter] = useState<Record<string, string>>(EMPTY_FILTER);

  const { roles, onLock, onUnlock, onChangeRole, dialogs } = useUserActions({ meIsOperator });

  const { data, isFetching, isError, refetch } = useQuery(
    createUserListQueryOptions({
      keyword: filter.keyword || undefined,
      roleId: filter.roleId ? Number(filter.roleId) : undefined,
      planCode: filter.planCode || undefined,
      status: filter.status || undefined,
      page: paging.pageIndex + 1,
      limit: paging.pageSize
    })
  );

  const filterFields = useMemo<TableSearchFilterField[]>(
    () => [
      { key: "keyword", label: "Tìm kiếm", placeholder: "Tìm theo tên, email hoặc số điện thoại" },
      {
        key: "roleId",
        label: "Chức vụ",
        type: "select",
        placeholder: "Tất cả",
        options: [
          { value: "", label: "Tất cả" },
          ...roles.map((r) => ({ value: String(r.id), label: r.name }))
        ]
      },
      {
        key: "planCode",
        label: "Gói",
        type: "select",
        placeholder: "Tất cả",
        options: [
          { value: "", label: "Tất cả" },
          { value: "free", label: "Miễn phí" },
          { value: "pro", label: "Pro" },
          { value: "studio", label: "Studio" }
        ]
      },
      {
        key: "status",
        label: "Trạng thái",
        type: "select",
        placeholder: "Tất cả",
        options: [
          { value: "", label: "Tất cả" },
          { value: "ACTIVE", label: "Đang hoạt động" },
          { value: "LOCKED", label: "Đã khoá" }
        ]
      }
    ],
    [roles]
  );

  const handlePaginationChange = useCallback((pageIndex: number, pageSize: number) => {
    setPaging((p) => (p.pageIndex === pageIndex && p.pageSize === pageSize ? p : { pageIndex, pageSize }));
  }, []);

  // Đổi bộ lọc → về trang 1
  const handleFilterChange = useCallback((values: Record<string, string>) => {
    setFilter(values);
    setPaging((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }));
  }, []);

  const openDetail = useCallback(
    (user: UserAdminItem) => void navigate({ to: "/admin/tai-khoan/$id", params: { id: String(user.id) } }),
    [navigate]
  );

  const columns = useMemo(
    () =>
      createUserColumns({
        me,
        canUpdate,
        onView: openDetail,
        onLock,
        onUnlock,
        onChangeRole
      }),
    [me, canUpdate, openDetail, onLock, onUnlock, onChangeRole]
  );

  return (
    <>
      {isError && <AdminListError onRetry={() => void refetch()} />}

      <DataTableAdvanced
        title="Tài khoản"
        description="Xem khách hàng và nhân viên, gói đang dùng, khoá tài khoản hoặc đổi chức vụ."
        data={data?.items ?? []}
        total={data?.total ?? 0}
        columns={columns}
        pageIndex={paging.pageIndex}
        pageSize={paging.pageSize}
        onPaginationChange={handlePaginationChange}
        isLoading={isFetching}
        onRefresh={() => void refetch()}
        filter={{ fields: filterFields, values: filter, onChange: handleFilterChange }}
        onRowClick={openDetail}
        emptyMessage="Không tìm thấy tài khoản nào phù hợp."
      />

      {dialogs}
    </>
  );
}
