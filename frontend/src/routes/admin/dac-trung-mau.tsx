import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState, useEffect } from "react";

import { AdminListError } from "@/components/admin/admin-list-error";
import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { createLutFeatureColumns } from "@/components/admin/lut-feature/columns";
import { LutFeatureSheet } from "@/components/admin/lut-feature/lut-feature-sheet";
import { DataTableAdvanced } from "@/components/admin/table/data-table-advanced";
import type { TableSearchFilterField } from "@/components/admin/table/table-search-filter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCanView } from "@/hooks/use-can-view";
import {
  createLutFeatureListQueryOptions,
  recomputeLutFeaturesMutationOptions
} from "@/lib/tanstack/options/lut-feature";
import {
  LUT_STYLE_LABEL,
  LUT_STYLES,
  type LutFeatureItemDTO
} from "@/lib/types/lut-feature";

const RESOURCE_CODE = "LUT";

const FILTER_FIELDS: TableSearchFilterField[] = [
  {
    key: "keyword",
    label: "Tìm kiếm",
    placeholder: "Tìm theo tên hoặc slug LUT"
  },
  {
    key: "style",
    label: "Phong cách",
    type: "select",
    options: [
      { value: "", label: "Tất cả" },
      ...LUT_STYLES.map((style) => ({ value: style, label: LUT_STYLE_LABEL[style] }))
    ]
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
    key: "hasFeature",
    label: "Đặc trưng",
    type: "select",
    options: [
      { value: "", label: "Tất cả" },
      { value: "1", label: "Đã tính" },
      { value: "0", label: "Chưa tính" }
    ]
  }
];

export const Route = createFileRoute("/admin/dac-trung-mau")({
  component: DacTrungMauRoute
});

function DacTrungMauRoute() {
  return (
    <AdminPermissionGuard code={RESOURCE_CODE}>
      <DacTrungMauPage />
    </AdminPermissionGuard>
  );
}

function DacTrungMauPage() {
  const { can } = useCanView();
  const canUpdate = can(RESOURCE_CODE, "UPDATE");

  const [paging, setPaging] = useState({ pageIndex: 0, pageSize: 10 });
  const [filter, setFilter] = useState<Record<string, string>>({
    keyword: "",
    style: "",
    status: "",
    hasFeature: ""
  });
  const [sheetItem, setSheetItem] = useState<LutFeatureItemDTO | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);
  const [failedItems, setFailedItems] = useState<LutFeatureItemDTO[]>([]);

  const hasFeatureParam =
    filter.hasFeature === "1" ? 1 : filter.hasFeature === "0" ? 0 : undefined;

  const { data, isFetching, isError, refetch } = useQuery(
    createLutFeatureListQueryOptions({
      keyword: filter.keyword || undefined,
      style: filter.style || undefined,
      status: filter.status || undefined,
      hasFeature: hasFeatureParam,
      paging: { page: paging.pageIndex + 1, limit: paging.pageSize }
    })
  );

  const { mutate: recomputeMutate, isPending: isRecomputing } = useMutation({
    ...recomputeLutFeaturesMutationOptions,
    onSuccess: (result) => {
      const errors = result.filter((item) => !!item.featureError);
      setFailedItems(errors);

      if (sheetItem) {
        const updated = result.find((item) => item.id === sheetItem.id);
        if (updated) {
          setSheetItem(updated);
        }
      }
    }
  });

  useEffect(() => {
    if (sheetItem && data?.items) {
      const fresh = data.items.find((i) => i.id === sheetItem.id);
      if (fresh) {
        setSheetItem(fresh);
      }
    }
  }, [data, sheetItem]);

  const handlePaginationChange = useCallback((pageIndex: number, pageSize: number) => {
    setPaging((p) =>
      p.pageIndex === pageIndex && p.pageSize === pageSize ? p : { pageIndex, pageSize }
    );
  }, []);

  const handleOpenSheet = useCallback((item: LutFeatureItemDTO) => {
    setSheetItem(item);
    setSheetOpen(true);
  }, []);

  const handleRecompute = useCallback(
    (id: number) => {
      recomputeMutate([id]);
    },
    [recomputeMutate]
  );

  const columns = useMemo(
    () =>
      createLutFeatureColumns({
        canUpdate,
        onView: handleOpenSheet,
        onRecompute: handleRecompute
      }),
    [canUpdate, handleOpenSheet, handleRecompute]
  );

  return (
    <>
      {failedItems.length > 0 && (
        <div className="container mx-auto px-6 pt-6 -mb-2">
          <Alert variant="destructive" className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <AlertTitle>Một số LUT chưa tính được</AlertTitle>
              <AlertDescription className="flex flex-col gap-1">
                {failedItems.map((item) => (
                  <div key={item.id}>
                    {item.title}: {item.featureError}
                  </div>
                ))}
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFailedItems([])}
              className="text-destructive hover:text-destructive ml-4"
            >
              Đóng
            </Button>
          </Alert>
        </div>
      )}

      {isError && <AdminListError onRetry={() => void refetch()} />}

      <DataTableAdvanced
        title="Đặc trưng màu"
        description="Đặc trưng màu đo từ file .cube của từng LUT. Dùng để kiểm tra LUT có đúng như tên gọi và làm dữ liệu cho gợi ý."
        data={data?.items ?? []}
        total={data?.total ?? 0}
        columns={columns}
        pageIndex={paging.pageIndex}
        pageSize={paging.pageSize}
        onPaginationChange={handlePaginationChange}
        isLoading={isFetching || isRecomputing}
        onRefresh={() => void refetch()}
        filter={{ fields: FILTER_FIELDS, values: filter, onChange: setFilter }}
        onRowClick={handleOpenSheet}
        toolbarActions={
          canUpdate ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmAllOpen(true)}
              disabled={isRecomputing}
            >
              {isRecomputing ? "Đang tính…" : "Tính lại tất cả"}
            </Button>
          ) : undefined
        }
      />

      <LutFeatureSheet
        item={sheetItem}
        open={sheetOpen}
        canUpdate={canUpdate}
        isRecomputing={isRecomputing}
        onOpenChange={setSheetOpen}
        onRecompute={handleRecompute}
      />

      <AlertDialog open={confirmAllOpen} onOpenChange={setConfirmAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tính lại đặc trưng màu cho mọi LUT?</AlertDialogTitle>
            <AlertDialogDescription>
              Backend đọc lại file .cube của mọi LUT có file. Thường mất vài giây.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                recomputeMutate([]);
              }}
            >
              Tính lại
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
