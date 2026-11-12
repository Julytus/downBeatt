import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Copy, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { batchLabel } from "@/components/admin/recommend/labels";
import { SummaryCards } from "@/components/admin/recommend/summary-cards";
import { TabLoadError } from "@/components/admin/recommend/tab-load-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createEvalBatchesQueryOptions,
  createEvalReportQueryOptions,
  createEvalSummaryQueryOptions
} from "@/lib/tanstack/options/recommend-admin";

export interface SummaryTabProps {
  batch?: string;
  k: 5 | 10 | 20;
  onBatchChange: (batch?: string) => void;
  onKChange: (k: 5 | 10 | 20) => void;
}

export function SummaryTab({
  batch,
  k,
  onBatchChange,
  onKChange
}: SummaryTabProps) {
  const queryClient = useQueryClient();
  const [isReportLoading, setIsReportLoading] = useState(false);

  // 1. Lấy danh sách lô đánh giá
  const batchesQuery = useQuery(
    createEvalBatchesQueryOptions({ page: 1, limit: 50 })
  );

  const batches = batchesQuery.data?.items ?? [];

  // Xác định lô hiển thị mặc định: lô đầu tiên có hasTests, không thì lô đầu tiên
  const defaultBatch = batches.find((b) => b.hasTests) ?? batches[0];
  const activeBatchCode = batch || defaultBatch?.batchCode || "";

  // 2. Lấy dữ liệu tổng hợp của lô
  const summaryQuery = useQuery(
    createEvalSummaryQueryOptions(activeBatchCode)
  );

  const is404 =
    summaryQuery.error instanceof AxiosError &&
    summaryQuery.error.response?.status === 404;

  const handleCopyMarkdown = async () => {
    if (!activeBatchCode) return;
    setIsReportLoading(true);
    try {
      const report = await queryClient.fetchQuery(
        createEvalReportQueryOptions(activeBatchCode)
      );
      await navigator.clipboard.writeText(report.markdown);
      toast.success("Đã sao chép bảng Markdown");
    } catch {
      toast.error("Không sao chép được bảng Markdown");
    } finally {
      setIsReportLoading(false);
    }
  };

  const handleDownloadMarkdown = async () => {
    if (!activeBatchCode) return;
    setIsReportLoading(true);
    try {
      const report = await queryClient.fetchQuery(
        createEvalReportQueryOptions(activeBatchCode)
      );
      const blob = new Blob([report.markdown], {
        type: "text/markdown;charset=utf-8"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = report.fileName || `ket-qua-danh-gia-${activeBatchCode}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Không tải được bảng Markdown");
    } finally {
      setIsReportLoading(false);
    }
  };

  // Trạng thái: Lỗi mạng / 5xx
  if (batchesQuery.isError || (summaryQuery.isError && !is404)) {
    return (
      <TabLoadError
        onRetry={() => {
          void batchesQuery.refetch();
          void summaryQuery.refetch();
        }}
      />
    );
  }

  // Trạng thái: Chưa có lô đánh giá nào (batches trả 0 lô)
  if (!batchesQuery.isLoading && batches.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Chưa có lô đánh giá nào</EmptyTitle>
          <EmptyDescription>
            Chạy trình đánh giá offline (profile eval) để có bảng tổng hợp và kiểm định thống kê.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  // Trạng thái: Đang tải lần đầu khi chưa có danh sách lô
  if (batchesQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Skeleton className="h-9 w-full sm:w-[380px]" />
            <Skeleton className="h-9 w-full sm:w-[110px]" />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Skeleton className="h-9 w-full sm:w-36" />
            <Skeleton className="h-9 w-full sm:w-28" />
          </div>
        </div>
        <Skeleton className="h-5 w-3/4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const summary = summaryQuery.data;

  // Dòng phụ dưới thanh công cụ
  const subLineText = summary
    ? summary.seeds.length >= 2
      ? `${summary.dataset} · ${summary.lutCount} LUT · ${summary.simUserCount} người mô phỏng · hạt giống ${summary.seeds.join(", ")} · trung bình ± độ lệch chuẩn qua ${summary.seeds.length} hạt giống`
      : `${summary.dataset} · ${summary.lutCount} LUT · ${summary.simUserCount} người mô phỏng · hạt giống ${summary.seeds.join(", ")} · 1 hạt giống, chưa có độ lệch chuẩn`
    : "";

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">
      {/* 6.2 Thanh công cụ */}
      <div className="flex flex-col gap-2 w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 w-full">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Select Lô đánh giá */}
            <Select
              value={activeBatchCode}
              onValueChange={(val) => onBatchChange(val)}
            >
              <SelectTrigger
                className="w-full sm:w-[380px]"
                aria-label="Lô đánh giá"
              >
                <SelectValue placeholder="Chọn lô đánh giá" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b.batchCode} value={b.batchCode}>
                    {batchLabel(b)}
                  </SelectItem>
                ))}
                {activeBatchCode &&
                  !batches.some((b) => b.batchCode === activeBatchCode) && (
                    <SelectItem value={activeBatchCode}>
                      {activeBatchCode}
                    </SelectItem>
                  )}
              </SelectContent>
            </Select>

            {/* Select Số gợi ý */}
            <Select
              value={String(k)}
              onValueChange={(val) => onKChange(Number(val) as 5 | 10 | 20)}
            >
              <SelectTrigger
                className="w-full sm:w-[110px]"
                aria-label="Số gợi ý"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">K = 5</SelectItem>
                <SelectItem value="10">K = 10</SelectItem>
                <SelectItem value="20">K = 20</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nút Sao chép Markdown / Tải .md */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleCopyMarkdown}
              disabled={isReportLoading || !activeBatchCode}
            >
              <Copy className="mr-2 size-4" />
              Sao chép Markdown
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleDownloadMarkdown}
              disabled={isReportLoading || !activeBatchCode}
            >
              <Download className="mr-2 size-4" />
              Tải .md
            </Button>
          </div>
        </div>

        {/* Dòng chữ phụ dưới thanh công cụ */}
        {subLineText && (
          <p className="text-sm text-muted-foreground">{subLineText}</p>
        )}
      </div>

      {/* Trạng thái 404: Không tìm thấy lô đánh giá */}
      {is404 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Không tìm thấy lô đánh giá</EmptyTitle>
            <EmptyDescription>
              {`Lô ${activeBatchCode} không có trong dữ liệu đánh giá.`}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => onBatchChange(undefined)}>
              Xem lô mới nhất
            </Button>
          </EmptyContent>
        </Empty>
      ) : summaryQuery.isLoading ? (
        // Đang tải dữ liệu summary của lô
        Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))
      ) : summary ? (
        // 5 Card kết quả
        <SummaryCards summary={summary} k={k} />
      ) : null}
    </div>
  );
}
