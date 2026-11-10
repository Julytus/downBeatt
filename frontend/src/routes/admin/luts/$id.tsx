import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { ExternalLink } from "lucide-react";

import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { FileSlot } from "@/components/admin/lut/file-slot";
import { LutColorFeatureCard } from "@/components/admin/lut/lut-color-feature-card";
import { LutHideDialog } from "@/components/admin/lut/lut-hide-dialog";
import { LutInfoForm } from "@/components/admin/lut/lut-info-form";
import { PublishChecklistCard } from "@/components/admin/lut/publish-checklist-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCanView } from "@/hooks/use-can-view";
import { publishChecklist } from "@/lib/lut-admin/publish-checklist";
import { lutCategoriesQueryOptions } from "@/lib/tanstack/options/luts";
import {
  createHideLutMutationOptions,
  createLutAdminDetailQueryOptions,
  createPublishLutMutationOptions,
  createUpsertLutMutationOptions,
  lutCreatorsQueryOptions
} from "@/lib/tanstack/options/lut-admin";
import { LUT_STATUS_LABEL } from "@/lib/types/lut-admin";

const RESOURCE_CODE = "LUT";

export const Route = createFileRoute("/admin/luts/$id")({
  component: LutDetailRoute
});

function LutDetailRoute() {
  return (
    <AdminPermissionGuard code={RESOURCE_CODE}>
      <LutDetailPage />
    </AdminPermissionGuard>
  );
}

function LutDetailPage() {
  const { id: rawId } = Route.useParams();
  const id = Number(rawId);
  const isValidId = !isNaN(id) && id > 0 && Number.isInteger(id);

  const queryClient = useQueryClient();
  const { can } = useCanView();
  const canUpdate = can(RESOURCE_CODE, "UPDATE");

  const [hideDialogOpen, setHideDialogOpen] = useState(false);
  const [activePreviewType, setActivePreviewType] = useState<"BEFORE_AFTER" | "VIDEO">(
    "BEFORE_AFTER"
  );

  const {
    data: detail,
    isFetching,
    isError,
    error,
    refetch
  } = useQuery({
    ...createLutAdminDetailQueryOptions(id),
    enabled: isValidId
  });

  const { data: creators = [] } = useQuery({
    ...lutCreatorsQueryOptions,
    enabled: isValidId
  });

  const { data: categories = [] } = useQuery({
    ...lutCategoriesQueryOptions,
    enabled: isValidId
  });

  useEffect(() => {
    if (detail?.previewType) {
      setActivePreviewType(detail.previewType);
    }
  }, [detail?.previewType]);

  const upsertMutation = useMutation(createUpsertLutMutationOptions(true, queryClient));
  const publishMutation = useMutation(createPublishLutMutationOptions(queryClient));
  const hideMutation = useMutation(createHideLutMutationOptions(queryClient));

  const checklistItems = useMemo(
    () => publishChecklist(detail, categories),
    [detail, categories]
  );
  const isPublishable = checklistItems.every((item) => item.ok);

  // 1. Trường hợp ID không hợp lệ hoặc 404 (TC-31)
  const is404 =
    !isValidId ||
    (isError &&
      ((error as AxiosError)?.response?.status === 404 ||
        (error as AxiosError)?.status === 404));

  if (is404) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 p-12 text-center min-h-[50vh]">
        <h1 className="text-2xl font-bold tracking-tight">Không tìm thấy LUT</h1>
        <p className="text-muted-foreground text-sm">
          LUT không tồn tại hoặc đã bị xóa.
        </p>
        <Link
          to="/admin/luts"
          className="text-primary hover:underline font-medium text-sm"
        >
          Về danh sách LUT
        </Link>
      </div>
    );
  }

  // 2. Trường hợp đang tải
  if (isFetching && !detail) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // 3. Trường hợp lỗi khác 404
  if (isError && !detail) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 p-12 text-center">
        <p className="text-destructive font-medium">Không tải được LUT</p>
        <Button onClick={() => void refetch()} variant="outline">
          Thử lại
        </Button>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Hàng đầu */}
      <div className="space-y-3">
        <Link
          to="/admin/luts"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Danh sách LUT
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {detail.title}
              </h1>
              <Badge
                variant={
                  detail.status === "PUBLISHED"
                    ? "default"
                    : detail.status === "HIDDEN"
                    ? "secondary"
                    : "outline"
                }
              >
                {LUT_STATUS_LABEL[detail.status] ?? detail.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">/luts/{detail.slug}</p>
          </div>

          <div className="flex items-center gap-2">
            {detail.status === "PUBLISHED" && (
              <a
                href={`/luts/${detail.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline" })}
              >
                <ExternalLink className="mr-1.5 size-4" />
                Xem ở cửa hàng
              </a>
            )}

            {(detail.status === "DRAFT" || detail.status === "HIDDEN") && canUpdate && (
              <Button
                onClick={() => publishMutation.mutate(detail.id)}
                disabled={!isPublishable || publishMutation.isPending}
              >
                {publishMutation.isPending ? "Đang xuất bản…" : "Xuất bản"}
              </Button>
            )}

            {detail.status === "PUBLISHED" && canUpdate && (
              <Button
                variant="outline"
                onClick={() => setHideDialogOpen(true)}
                disabled={hideMutation.isPending}
              >
                Ẩn
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bố cục 2 cột (≥ lg: trái 3/5, phải 2/5) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Cột trái: Form thông tin */}
        <div className="lg:col-span-3">
          <LutInfoForm
            detail={detail}
            creators={creators}
            allCategories={categories}
            canUpdate={canUpdate}
            isSubmitting={upsertMutation.isPending}
            onActivePreviewTypeChange={setActivePreviewType}
            onSubmit={(values) => upsertMutation.mutateAsync(values)}
          />
        </div>

        {/* Cột phải: File, Đặc trưng màu, Ảnh/Video, Điều kiện xuất bản */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. File LUT (.cube) */}
          <Card data-slot="card">
            <CardHeader>
              <CardTitle>File LUT (.cube)</CardTitle>
            </CardHeader>
            <CardContent>
              <FileSlot
                lutId={detail.id}
                kind="CUBE"
                lutSize={detail.lutSize}
                fileSizeKb={detail.fileSizeKb}
                canUpdate={canUpdate}
              />
            </CardContent>
          </Card>

          {/* 2. Đặc trưng màu */}
          {detail.colorFeature ? (
            <LutColorFeatureCard feature={detail.colorFeature} />
          ) : (
            <Card data-slot="card">
              <CardHeader>
                <CardTitle>Đặc trưng màu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Chưa có đặc trưng màu</p>
                <p>Tải file .cube để đo đặc trưng màu.</p>
              </CardContent>
            </Card>
          )}

          {/* 3. Ảnh và video xem trước */}
          <Card data-slot="card">
            <CardHeader>
              <CardTitle>Ảnh và video xem trước</CardTitle>
              <CardDescription>
                Chọn file là tải lên ngay, không cần bấm Lưu thay đổi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileSlot
                lutId={detail.id}
                kind="COVER"
                currentUrl={detail.coverUrl}
                canUpdate={canUpdate}
              />

              {activePreviewType === "BEFORE_AFTER" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FileSlot
                    lutId={detail.id}
                    kind="BEFORE"
                    currentUrl={detail.beforeUrl}
                    canUpdate={canUpdate}
                  />
                  <FileSlot
                    lutId={detail.id}
                    kind="AFTER"
                    currentUrl={detail.afterUrl}
                    canUpdate={canUpdate}
                  />
                </div>
              ) : (
                <FileSlot
                  lutId={detail.id}
                  kind="VIDEO"
                  currentUrl={detail.previewVideoUrl}
                  canUpdate={canUpdate}
                />
              )}
            </CardContent>
          </Card>

          {/* 4. Điều kiện xuất bản */}
          <PublishChecklistCard detail={detail} categories={categories} />
        </div>
      </div>

      {/* Dialog xác nhận ẩn */}
      <LutHideDialog
        open={hideDialogOpen}
        lutId={detail.id}
        lutTitle={detail.title}
        isLoading={hideMutation.isPending}
        onConfirm={(lutId) =>
          hideMutation.mutate(lutId, {
            onSuccess: () => setHideDialogOpen(false)
          })
        }
        onOpenChange={setHideDialogOpen}
      />
    </div>
  );
}
