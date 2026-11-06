import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { AdminListError } from "@/components/admin/admin-list-error";
import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { createRoleColumns } from "@/components/admin/role/columns";
import { RoleFormDialog } from "@/components/admin/role/role-dialog";
import { DataTableAdvanced } from "@/components/admin/table/data-table-advanced";
import type { TableSearchFilterField } from "@/components/admin/table/table-search-filter";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { useCanView } from "@/hooks/use-can-view";
import { deleteRole } from "@/lib/axios/role";
import {
  createRoleListQueryOptions,
  createUpsertRoleMutationOptions,
  deleteRoleMutationOptions,
  ROLES_QUERY_KEY
} from "@/lib/tanstack/options/role";
import type { RoleDTO } from "@/lib/types/role";

const RESOURCE_CODE = "ROLE";

const FILTER_FIELDS: TableSearchFilterField[] = [
  { key: "keyword", label: "Tìm kiếm", placeholder: "Tìm theo tên chức vụ..." }
];

export const Route = createFileRoute("/admin/chuc-vu")({
  component: RoleRoute
});

function RoleRoute() {
  return (
    <AdminPermissionGuard code={RESOURCE_CODE}>
      <RolePage />
    </AdminPermissionGuard>
  );
}

function RolePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = useCanView();
  const canAdd = can(RESOURCE_CODE, "ADD");
  const canUpdate = can(RESOURCE_CODE, "UPDATE");
  const canDelete = can(RESOURCE_CODE, "DELETE");
  const canPermission = can("PERMISSION", "VIEW");

  const [paging, setPaging] = useState({ pageIndex: 0, pageSize: 10 });
  const [filter, setFilter] = useState<Record<string, string>>({ keyword: "" });
  const [dialog, setDialog] = useState<{ open: boolean; role: RoleDTO | null }>({
    open: false,
    role: null
  });
  const [deleting, setDeleting] = useState<{ id: number; name?: string } | null>(null);

  const { data, isFetching, isError, refetch } = useQuery(
    createRoleListQueryOptions({
      keyword: filter.keyword || undefined,
      paging: { page: paging.pageIndex + 1, limit: paging.pageSize }
    })
  );

  const upsertMutation = useMutation({
    ...createUpsertRoleMutationOptions(dialog.role !== null),
    onSuccess: () => setDialog((d) => ({ ...d, open: false }))
  });
  const deleteMutation = useMutation(deleteRoleMutationOptions);
  const bulkDelete = useBulkDelete({
    deleteOne: deleteRole,
    label: "chức vụ",
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY })
  });

  const handlePaginationChange = useCallback((pageIndex: number, pageSize: number) => {
    setPaging((p) =>
      p.pageIndex === pageIndex && p.pageSize === pageSize ? p : { pageIndex, pageSize }
    );
  }, []);

  const columns = useMemo(
    () =>
      createRoleColumns({
        canPermission,
        canUpdate,
        canDelete,
        onPermission: (role) => void navigate({ to: "/admin/phan-quyen", search: { roleId: role.id } }),
        onEdit: (role) => setDialog({ open: true, role }),
        onShowDeleteConfirm: (id, name) => setDeleting({ id, name })
      }),
    [canPermission, canUpdate, canDelete, navigate]
  );

  return (
    <>
      {isError && <AdminListError onRetry={() => void refetch()} />}

      <DataTableAdvanced
        title="Chức vụ"
        description="Chức vụ của tài khoản quản trị. Quyền chi tiết cấp ở trang Phân quyền."
        data={data?.items ?? []}
        total={data?.total ?? 0}
        columns={columns}
        pageIndex={paging.pageIndex}
        pageSize={paging.pageSize}
        onPaginationChange={handlePaginationChange}
        isLoading={isFetching || bulkDelete.isPending}
        onRefresh={() => void refetch()}
        filter={{ fields: FILTER_FIELDS, values: filter, onChange: setFilter }}
        onAdd={canAdd ? () => setDialog({ open: true, role: null }) : undefined}
        addLabel="Thêm chức vụ"
        onDeleteSelected={canDelete ? (ids) => void bulkDelete.run(ids) : undefined}
      />

      <RoleFormDialog
        open={dialog.open}
        role={dialog.role}
        isLoading={upsertMutation.isPending}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        onSubmit={(values) => upsertMutation.mutate(values)}
      />

      <DeleteConfirmDialog
        open={deleting !== null}
        itemId={deleting?.id ?? null}
        itemName={deleting?.name}
        itemType="chức vụ"
        isLoading={deleteMutation.isPending}
        onConfirm={(id) => deleteMutation.mutate(id)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </>
  );
}
