import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { AdminListError } from "@/components/admin/admin-list-error";
import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { createResourceColumns } from "@/components/admin/resource/columns";
import { ResourceFormDialog } from "@/components/admin/resource/resource-dialog";
import { DataTableAdvanced } from "@/components/admin/table/data-table-advanced";
import type { TableSearchFilterField } from "@/components/admin/table/table-search-filter";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { useCanView } from "@/hooks/use-can-view";
import { deleteResource } from "@/lib/axios/resource";
import { allModulesQueryOptions } from "@/lib/tanstack/options/module";
import {
  createResourceListQueryOptions,
  createUpsertResourceMutationOptions,
  deleteResourceMutationOptions,
  RESOURCES_QUERY_KEY
} from "@/lib/tanstack/options/resource";
import type { ResourceDTO } from "@/lib/types/resource";

const RESOURCE_CODE = "RESOURCE";

export const Route = createFileRoute("/admin/tai-nguyen")({
  component: ResourceRoute
});

function ResourceRoute() {
  return (
    <AdminPermissionGuard code={RESOURCE_CODE}>
      <ResourcePage />
    </AdminPermissionGuard>
  );
}

function ResourcePage() {
  const queryClient = useQueryClient();
  const { can } = useCanView();
  const canAdd = can(RESOURCE_CODE, "ADD");
  const canUpdate = can(RESOURCE_CODE, "UPDATE");
  const canDelete = can(RESOURCE_CODE, "DELETE");

  const [paging, setPaging] = useState({ pageIndex: 0, pageSize: 10 });
  const [filter, setFilter] = useState<Record<string, string>>({ keyword: "", moduleId: "" });
  const [dialog, setDialog] = useState<{ open: boolean; resource: ResourceDTO | null }>({
    open: false,
    resource: null
  });
  const [deleting, setDeleting] = useState<{ id: number; name?: string } | null>(null);

  // Không có quyền MODULE thì query lỗi: cột Module hiện "Chưa phân module", bộ lọc chỉ còn "Tất cả"
  const modulesQuery = useQuery({ ...allModulesQueryOptions, enabled: can("MODULE", "VIEW") });
  const modules = useMemo(() => modulesQuery.data?.items ?? [], [modulesQuery.data]);
  const moduleNames = useMemo(() => new Map(modules.map((m) => [m.id, m.name])), [modules]);

  const filterFields = useMemo<TableSearchFilterField[]>(
    () => [
      { key: "keyword", label: "Tìm kiếm", placeholder: "Tìm theo tên, code, URI..." },
      {
        key: "moduleId",
        label: "Module",
        type: "select",
        placeholder: "Tất cả",
        options: [
          { value: "", label: "Tất cả" },
          { value: "none", label: "Chưa phân module" },
          ...modules.map((m) => ({ value: String(m.id), label: m.name }))
        ]
      }
    ],
    [modules]
  );

  const { data, isFetching, isError, refetch } = useQuery(
    createResourceListQueryOptions({
      keyword: filter.keyword || undefined,
      moduleId: filter.moduleId && filter.moduleId !== "none" ? Number(filter.moduleId) : undefined,
      unassigned: filter.moduleId === "none" || undefined,
      paging: { page: paging.pageIndex + 1, limit: paging.pageSize }
    })
  );

  const upsertMutation = useMutation({
    ...createUpsertResourceMutationOptions(dialog.resource !== null),
    onSuccess: () => setDialog((d) => ({ ...d, open: false }))
  });
  // Bật / tắt ngay trên bảng: cùng API update, không đóng dialog nào
  const toggleMutation = useMutation(createUpsertResourceMutationOptions(true));
  const deleteMutation = useMutation(deleteResourceMutationOptions);
  const bulkDelete = useBulkDelete({
    deleteOne: deleteResource,
    label: "tài nguyên",
    onSettled: () => void queryClient.invalidateQueries({ queryKey: RESOURCES_QUERY_KEY })
  });

  const handlePaginationChange = useCallback((pageIndex: number, pageSize: number) => {
    setPaging((p) =>
      p.pageIndex === pageIndex && p.pageSize === pageSize ? p : { pageIndex, pageSize }
    );
  }, []);

  const { mutate: toggleActive } = toggleMutation;
  const columns = useMemo(
    () =>
      createResourceColumns({
        canUpdate,
        canDelete,
        moduleNames,
        onEdit: (resource) => setDialog({ open: true, resource }),
        onShowDeleteConfirm: (id, name) => setDeleting({ id, name }),
        onToggleActive: (resource, active) => toggleActive({ ...resource, active: active ? 1 : 0 })
      }),
    [canUpdate, canDelete, moduleNames, toggleActive]
  );

  return (
    <>
      {isError && <AdminListError onRetry={() => void refetch()} />}

      <DataTableAdvanced
        title="Tài nguyên"
        description="Nhóm API (URI khớp controller) và các hành động được phân quyền."
        data={data?.items ?? []}
        total={data?.total ?? 0}
        columns={columns}
        pageIndex={paging.pageIndex}
        pageSize={paging.pageSize}
        onPaginationChange={handlePaginationChange}
        isLoading={isFetching || bulkDelete.isPending}
        onRefresh={() => void refetch()}
        filter={{ fields: filterFields, values: filter, onChange: setFilter }}
        onAdd={canAdd ? () => setDialog({ open: true, resource: null }) : undefined}
        addLabel="Thêm tài nguyên"
        onDeleteSelected={canDelete ? (ids) => void bulkDelete.run(ids) : undefined}
      />

      <ResourceFormDialog
        open={dialog.open}
        resource={dialog.resource}
        isLoading={upsertMutation.isPending}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        onSubmit={(values) => upsertMutation.mutate(values)}
      />

      <DeleteConfirmDialog
        open={deleting !== null}
        itemId={deleting?.id ?? null}
        itemName={deleting?.name}
        itemType="tài nguyên"
        extraDescription="Quyền đã cấp trên tài nguyên này cho mọi chức vụ cũng bị xoá."
        isLoading={deleteMutation.isPending}
        onConfirm={(id) => deleteMutation.mutate(id)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </>
  );
}
