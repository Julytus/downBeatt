import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { AdminListError } from "@/components/admin/admin-list-error";
import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { AssignResourcesDialog } from "@/components/admin/module/assign-resources-dialog";
import { createModuleColumns } from "@/components/admin/module/columns";
import { ModuleFormDialog } from "@/components/admin/module/module-dialog";
import { DataTableAdvanced } from "@/components/admin/table/data-table-advanced";
import type { TableSearchFilterField } from "@/components/admin/table/table-search-filter";
import { useBulkDelete } from "@/hooks/use-bulk-delete";
import { useCanView } from "@/hooks/use-can-view";
import { deleteModule } from "@/lib/axios/module";
import {
  assignModuleResourcesMutationOptions,
  createModuleListQueryOptions,
  createUpsertModuleMutationOptions,
  deleteModuleMutationOptions,
  MODULES_QUERY_KEY
} from "@/lib/tanstack/options/module";
import type { ModuleDTO } from "@/lib/types/module";

const RESOURCE_CODE = "MODULE";

const FILTER_FIELDS: TableSearchFilterField[] = [
  { key: "keyword", label: "Tìm kiếm", placeholder: "Tìm theo tên, code..." }
];

export const Route = createFileRoute("/admin/module")({
  component: ModuleRoute
});

function ModuleRoute() {
  return (
    <AdminPermissionGuard code={RESOURCE_CODE}>
      <ModulePage />
    </AdminPermissionGuard>
  );
}

function ModulePage() {
  const queryClient = useQueryClient();
  const { can } = useCanView();
  const canAdd = can(RESOURCE_CODE, "ADD");
  const canUpdate = can(RESOURCE_CODE, "UPDATE");
  const canDelete = can(RESOURCE_CODE, "DELETE");

  const [paging, setPaging] = useState({ pageIndex: 0, pageSize: 10 });
  const [filter, setFilter] = useState<Record<string, string>>({ keyword: "" });
  const [dialog, setDialog] = useState<{ open: boolean; module: ModuleDTO | null }>({
    open: false,
    module: null
  });
  const [assigning, setAssigning] = useState<{ open: boolean; module: ModuleDTO | null }>({
    open: false,
    module: null
  });
  const [deleting, setDeleting] = useState<{ id: number; name?: string } | null>(null);

  const { data, isFetching, isError, refetch } = useQuery(
    createModuleListQueryOptions({
      keyword: filter.keyword || undefined,
      paging: { page: paging.pageIndex + 1, limit: paging.pageSize }
    })
  );

  const upsertMutation = useMutation({
    ...createUpsertModuleMutationOptions(dialog.module !== null),
    onSuccess: () => setDialog((d) => ({ ...d, open: false }))
  });
  const toggleMutation = useMutation(createUpsertModuleMutationOptions(true));
  const assignMutation = useMutation({
    ...assignModuleResourcesMutationOptions,
    onSuccess: () => setAssigning((a) => ({ ...a, open: false }))
  });
  const deleteMutation = useMutation(deleteModuleMutationOptions);
  const bulkDelete = useBulkDelete({
    deleteOne: deleteModule,
    label: "module",
    onSettled: () => void queryClient.invalidateQueries({ queryKey: MODULES_QUERY_KEY })
  });

  const handlePaginationChange = useCallback((pageIndex: number, pageSize: number) => {
    setPaging((p) =>
      p.pageIndex === pageIndex && p.pageSize === pageSize ? p : { pageIndex, pageSize }
    );
  }, []);

  const { mutate: toggleActive } = toggleMutation;
  const columns = useMemo(
    () =>
      createModuleColumns({
        canUpdate,
        canDelete,
        onEdit: (module) => setDialog({ open: true, module }),
        onShowDeleteConfirm: (id, name) => setDeleting({ id, name }),
        onToggleActive: (module, active) => toggleActive({ ...module, active: active ? 1 : 0 }),
        onAssign: (module) => setAssigning({ open: true, module })
      }),
    [canUpdate, canDelete, toggleActive]
  );

  return (
    <>
      {isError && <AdminListError onRetry={() => void refetch()} />}

      <DataTableAdvanced
        title="Module"
        description="Gom tài nguyên theo module cho ma trận phân quyền."
        data={data?.items ?? []}
        total={data?.total ?? 0}
        columns={columns}
        pageIndex={paging.pageIndex}
        pageSize={paging.pageSize}
        onPaginationChange={handlePaginationChange}
        isLoading={isFetching || bulkDelete.isPending}
        onRefresh={() => void refetch()}
        filter={{ fields: FILTER_FIELDS, values: filter, onChange: setFilter }}
        onAdd={canAdd ? () => setDialog({ open: true, module: null }) : undefined}
        addLabel="Thêm module"
        onDeleteSelected={canDelete ? (ids) => void bulkDelete.run(ids) : undefined}
      />

      <ModuleFormDialog
        open={dialog.open}
        module={dialog.module}
        isLoading={upsertMutation.isPending}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        onSubmit={(values) => upsertMutation.mutate(values)}
      />

      <AssignResourcesDialog
        open={assigning.open}
        module={assigning.module}
        isPending={assignMutation.isPending}
        onOpenChange={(open) => setAssigning((a) => ({ ...a, open }))}
        onAssign={(moduleId, resourceIds) => assignMutation.mutate({ moduleId, resourceIds })}
      />

      <DeleteConfirmDialog
        open={deleting !== null}
        itemId={deleting?.id ?? null}
        itemName={deleting?.name}
        itemType="module"
        extraDescription="Tài nguyên của module chuyển về “Chưa phân module”, không bị xoá."
        isLoading={deleteMutation.isPending}
        onConfirm={(id) => deleteMutation.mutate(id)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </>
  );
}
