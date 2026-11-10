import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { AdminListError } from "@/components/admin/admin-list-error";
import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { createLutColumns } from "@/components/admin/lut/columns";
import { LutCreateDialog } from "@/components/admin/lut/lut-create-dialog";
import { LutHideDialog } from "@/components/admin/lut/lut-hide-dialog";
import { DataTableAdvanced } from "@/components/admin/table/data-table-advanced";
import type { TableSearchFilterField } from "@/components/admin/table/table-search-filter";
import { useCanView } from "@/hooks/use-can-view";
import {
  createHideLutMutationOptions,
  createLutAdminListQueryOptions,
  createPublishLutMutationOptions,
  createUpsertLutMutationOptions,
  deleteLutMutationOptions
} from "@/lib/tanstack/options/lut-admin";
import {
  LUT_STYLE_LABEL,
  LUT_STYLES,
  type LutAdminItemDTO
} from "@/lib/types/lut-admin";

const RESOURCE_CODE = "LUT";

const FILTER_FIELDS: TableSearchFilterField[] = [
  {
    key: "keyword",
    label: "Tìm kiếm",
    placeholder: "Tìm theo tên hoặc slug LUT"
  },
  {
    key: "status",
    label: "Trạng thái",
    type: "select",
    options: [
      { value: "", label: "Tất cả" },
      { value: "DRAFT", label: "Nháp" },
      { value: "PUBLISHED", label: "Đã xuất bản" },
      { value: "HIDDEN", label: "Đã ẩn" }
    ]
  },
  {
    key: "style",
    label: "Phong cách",
    type: "select",
    options: [
      { value: "", label: "Tất cả" },
      ...LUT_STYLES.map((style) => ({
        value: style,
        label: LUT_STYLE_LABEL[style]
      }))
    ]
  }
];

export const Route = createFileRoute("/admin/luts/")({
  component: LutListRoute
});

function LutListRoute() {
  return (
    <AdminPermissionGuard code={RESOURCE_CODE}>
      <LutListPage />
    </AdminPermissionGuard>
  );
}

function LutListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = useCanView();
  const canAdd = can(RESOURCE_CODE, "ADD");
  const canUpdate = can(RESOURCE_CODE, "UPDATE");
  const canDelete = can(RESOURCE_CODE, "DELETE");

  const [paging, setPaging] = useState({ pageIndex: 0, pageSize: 10 });
  const [filter, setFilter] = useState<Record<string, string>>({
    keyword: "",
    status: "",
    style: ""
  });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [hidingItem, setHidingItem] = useState<LutAdminItemDTO | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: number; title?: string } | null>(null);

  const { data, isFetching, isError, refetch } = useQuery(
    createLutAdminListQueryOptions({
      keyword: filter.keyword || undefined,
      status: filter.status || undefined,
      style: filter.style || undefined,
      paging: { page: paging.pageIndex + 1, limit: paging.pageSize }
    })
  );

  const createMutation = useMutation({
    ...createUpsertLutMutationOptions(false),
    onSuccess: (created) => {
      setCreateDialogOpen(false);
      void navigate({
        to: "/admin/luts/$id",
        params: { id: String(created.id) }
      });
    }
  });

  const deleteMutation = useMutation(deleteLutMutationOptions);
  const { mutate: publishLutItem } = useMutation(createPublishLutMutationOptions(queryClient));
  const hideMutation = useMutation({
    ...createHideLutMutationOptions(queryClient),
    onSuccess: () => setHidingItem(null)
  });

  const handlePaginationChange = useCallback((pageIndex: number, pageSize: number) => {
    setPaging((p) =>
      p.pageIndex === pageIndex && p.pageSize === pageSize ? p : { pageIndex, pageSize }
    );
  }, []);

  const columns = useMemo(
    () =>
      createLutColumns({
        canUpdate,
        canDelete,
        onEdit: (item) =>
          void navigate({
            to: "/admin/luts/$id",
            params: { id: String(item.id) }
          }),
        onPublish: (id) => publishLutItem(id),
        onHide: (item) => setHidingItem(item),
        onShowDeleteConfirm: (id, title) => setDeletingItem({ id, title })
      }),
    [canUpdate, canDelete, navigate, publishLutItem]
  );

  return (
    <>
      {isError && <AdminListError onRetry={() => void refetch()} />}

      <DataTableAdvanced
        title="LUT"
        description="Thêm LUT mới, tải file .cube và ảnh xem trước, xuất bản hoặc ẩn khỏi cửa hàng."
        data={data?.items ?? []}
        total={data?.total ?? 0}
        columns={columns}
        pageIndex={paging.pageIndex}
        pageSize={paging.pageSize}
        onPaginationChange={handlePaginationChange}
        isLoading={isFetching}
        onRefresh={() => void refetch()}
        filter={{ fields: FILTER_FIELDS, values: filter, onChange: setFilter }}
        onAdd={canAdd ? () => setCreateDialogOpen(true) : undefined}
        addLabel="Thêm LUT"
      />

      <LutCreateDialog
        open={createDialogOpen}
        isLoading={createMutation.isPending}
        onOpenChange={setCreateDialogOpen}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <LutHideDialog
        open={hidingItem !== null}
        lutId={hidingItem?.id ?? null}
        lutTitle={hidingItem?.title}
        isLoading={hideMutation.isPending}
        onConfirm={(id) => hideMutation.mutate(id)}
        onOpenChange={(open) => {
          if (!open) setHidingItem(null);
        }}
      />

      <DeleteConfirmDialog
        open={deletingItem !== null}
        itemId={deletingItem?.id ?? null}
        itemName={deletingItem?.title}
        itemType="LUT"
        isLoading={deleteMutation.isPending}
        onConfirm={(id) => deleteMutation.mutate(id)}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null);
        }}
      />
    </>
  );
}
