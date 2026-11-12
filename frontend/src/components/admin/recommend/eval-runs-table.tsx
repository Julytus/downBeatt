import { GitCompare } from "lucide-react";

import {
  EVAL_ALGORITHMS,
  EVAL_ALGORITHM_LABELS,
  EVAL_METRICS,
  EVAL_SCENARIO_OPTIONS,
  evalScenarioLabel,
  formatDateTimeShort,
  formatMetricValue
} from "@/components/admin/recommend/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { RecEvalRunDTO } from "@/lib/types/recommend";

export interface EvalRunsTableProps {
  runs: RecEvalRunDTO[];
  total: number;
  page: number;
  scen?: string;
  algo?: string;
  k: number;
  selectedIds: number[];
  onScenarioChange: (scen: string) => void;
  onAlgoChange: (algo: string) => void;
  onKChange: (k: number) => void;
  onPageChange: (page: number) => void;
  onSelectChange: (selectedIds: number[]) => void;
  onCompare: () => void;
  isLoading: boolean;
}

export function EvalRunsTable({
  runs,
  total,
  page,
  scen,
  algo,
  k,
  selectedIds,
  onScenarioChange,
  onAlgoChange,
  onKChange,
  onPageChange,
  onSelectChange,
  onCompare,
  isLoading
}: EvalRunsTableProps) {
  const totalPages = Math.ceil(total / 20);

  const handleToggle = (id: number, checked: boolean) => {
    if (checked) {
      if (selectedIds.length < 2 && !selectedIds.includes(id)) {
        onSelectChange([...selectedIds, id]);
      }
    } else {
      onSelectChange(selectedIds.filter((item) => item !== id));
    }
  };

  const coldMatch = scen?.match(/^cold-user-(\d+)$/);

  return (
    <div className="flex flex-col gap-4 w-full min-w-0 max-w-full">
      {/* 6.2 Thanh công cụ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          <Select
            value={scen || "standard"}
            onValueChange={(val) => onScenarioChange(val)}
          >
            <SelectTrigger aria-label="Kịch bản" className="w-full sm:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVAL_SCENARIO_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={algo || "all"}
            onValueChange={(val) => onAlgoChange(val === "all" ? "" : val)}
          >
            <SelectTrigger aria-label="Thuật toán" className="w-full sm:w-[260px]">
              <SelectValue placeholder="Tất cả thuật toán" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thuật toán</SelectItem>
              {EVAL_ALGORITHMS.map((a) => (
                <SelectItem key={a} value={a}>
                  {EVAL_ALGORITHM_LABELS[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(k)}
            onValueChange={(val) => onKChange(Number(val))}
          >
            <SelectTrigger aria-label="Số gợi ý" className="w-full sm:w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">K = 5</SelectItem>
              <SelectItem value="10">K = 10</SelectItem>
              <SelectItem value="20">K = 20</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-end gap-3">
          <span className="text-sm text-muted-foreground">
            Đã chọn {selectedIds.length}/2
          </span>
          <Button
            size="sm"
            disabled={selectedIds.length !== 2}
            onClick={onCompare}
          >
            <GitCompare className="mr-2 size-4" />
            So sánh
          </Button>
        </div>
      </div>

      {coldMatch && (
        <p className="text-sm text-muted-foreground">
          {`Người dùng mới chỉ có sở thích khai báo và ${coldMatch[1]} sự kiện đầu tiên; chỉ số đo trên các LUT họ tải hoặc yêu thích sau đó.`}
        </p>
      )}

      {/* 6.3 Bảng Các lần chạy */}
      <Card data-slot="card" className="w-full min-w-0 max-w-full">
        <CardHeader>
          <CardTitle>Các lần chạy</CardTitle>
          <CardDescription>
            Mỗi dòng là một thuật toán chạy trên bộ D1 mô phỏng với một hạt giống.
            Chỉ số càng cao càng tốt.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <span className="sr-only">Chọn</span>
                </TableHead>
                <TableHead>Lô</TableHead>
                <TableHead>Thời điểm</TableHead>
                <TableHead>Thuật toán</TableHead>
                <TableHead>Kịch bản</TableHead>
                <TableHead>Hạt giống</TableHead>
                <TableHead>Người dùng</TableHead>
                {EVAL_METRICS.map((metric) => (
                  <TableHead key={metric.key} className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help inline-block">
                          {metric.header(k)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{metric.tooltip}</TooltipContent>
                    </Tooltip>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="w-12">
                      <Skeleton className="size-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    {EVAL_METRICS.map((m) => (
                      <TableCell key={m.key} className="text-right">
                        <Skeleton className="h-4 w-14 ml-auto" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : runs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={17}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Không có lần chạy nào khớp bộ lọc.
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((run, index) => {
                  const isNewBatch =
                    index > 0 && run.batchCode !== runs[index - 1].batchCode;
                  const isChecked = selectedIds.includes(run.id);
                  const isDisabled = selectedIds.length >= 2 && !isChecked;
                  const kMetrics = run.metrics?.[String(k)];

                  return (
                    <TableRow
                      key={run.id}
                      className={cn(
                        isNewBatch && "border-t-2 border-t-foreground/25"
                      )}
                    >
                      <TableCell className="w-12">
                        <Checkbox
                          aria-label={`Chọn lần chạy #${run.id}`}
                          checked={isChecked}
                          disabled={isDisabled}
                          onCheckedChange={(checked) =>
                            handleToggle(run.id, !!checked)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {run.batchCode}
                      </TableCell>
                      <TableCell>
                        {formatDateTimeShort(run.createdTime)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>
                            {EVAL_ALGORITHM_LABELS[run.algorithm] ?? run.algorithm}
                          </span>
                          {run.params?.tuned === true && (
                            <Badge variant="secondary">tinh chỉnh</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {evalScenarioLabel(run.scenario ?? "standard")}
                      </TableCell>
                      <TableCell>{String(run.params.seed ?? "—")}</TableCell>
                      <TableCell>{String(run.userCount)}</TableCell>
                      {EVAL_METRICS.map((metric) => {
                        const val = kMetrics?.[metric.key];
                        return (
                          <TableCell key={metric.key} className="text-right">
                            {val !== undefined
                              ? formatMetricValue(val, metric.digits)
                              : "—"}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
        {total > 0 && (
          <CardFooter className="flex items-center justify-between border-t py-4">
            <span className="text-sm text-muted-foreground">
              Trang {page}/{totalPages || 1}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => onPageChange(page - 1)}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => onPageChange(page + 1)}
              >
                Sau
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
