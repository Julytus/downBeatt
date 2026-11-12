import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useMemo } from "react";

import {
  areParamValuesDifferent,
  EVAL_ALGORITHM_LABELS,
  EVAL_METRICS,
  flattenParams,
  formatMetricValue,
  formatParamValue,
  formatSignedDiff,
  formatSignedPercentChange
} from "@/components/admin/recommend/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { createEvalRunQueryOptions } from "@/lib/tanstack/options/recommend-admin";
import { cn } from "@/lib/utils";

export interface EvalCompareCardProps {
  aId: number;
  bId: number;
  k: number;
  onClose: () => void;
}

export function EvalCompareCard({
  aId,
  bId,
  k,
  onClose
}: EvalCompareCardProps) {
  const queryA = useQuery(createEvalRunQueryOptions(aId));
  const queryB = useQuery(createEvalRunQueryOptions(bId));

  const isLoading = queryA.isLoading || queryB.isLoading;
  const isErrorA = queryA.isError;
  const isErrorB = queryB.isError;
  const hasError = isErrorA || isErrorB;

  const runA = queryA.data;
  const runB = queryB.data;

  const flatParamsA = useMemo(
    () => (runA ? flattenParams(runA.params) : {}),
    [runA]
  );
  const flatParamsB = useMemo(
    () => (runB ? flattenParams(runB.params) : {}),
    [runB]
  );

  const paramKeys = useMemo(() => {
    const keys = new Set([
      ...Object.keys(flatParamsA),
      ...Object.keys(flatParamsB)
    ]);
    return Array.from(keys);
  }, [flatParamsA, flatParamsB]);

  const labelA = runA
    ? EVAL_ALGORITHM_LABELS[runA.algorithm] ?? runA.algorithm
    : "";
  const labelB = runB
    ? EVAL_ALGORITHM_LABELS[runB.algorithm] ?? runB.algorithm
    : "";

  return (
    <Card data-slot="card" className="w-full min-w-0 max-w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>So sánh hai lần chạy</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="mr-2 size-4" />
          Đóng so sánh
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : hasError ? (
          <div className="space-y-2 py-2">
            {isErrorA && (
              <p className="text-sm text-destructive">
                Không tìm thấy lần chạy đánh giá #{aId}
              </p>
            )}
            {isErrorB && (
              <p className="text-sm text-destructive">
                Không tìm thấy lần chạy đánh giá #{bId}
              </p>
            )}
          </div>
        ) : runA && runB ? (
          <>
            {/* Nhãn A và B */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm font-medium text-foreground">
              <div>
                A: #{runA.id} {labelA} · lô {runA.batchCode} · hạt giống{" "}
                {String(runA.params.seed ?? "—")}
              </div>
              <div>
                B: #{runB.id} {labelB} · lô {runB.batchCode} · hạt giống{" "}
                {String(runB.params.seed ?? "—")}
              </div>
            </div>

            {/* Bảng Chỉ số */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold tracking-tight">Chỉ số</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chỉ số</TableHead>
                    <TableHead className="text-right">A</TableHead>
                    <TableHead className="text-right">B</TableHead>
                    <TableHead className="text-right">
                      Chênh lệch (B − A)
                    </TableHead>
                    <TableHead className="text-right">Thay đổi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Hàng 1: Người dùng được tính */}
                  <TableRow>
                    <TableCell className="font-medium">
                      Người dùng được tính
                    </TableCell>
                    <TableCell className="text-right">
                      {runA.userCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {runB.userCount}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right",
                        runB.userCount - runA.userCount > 0 &&
                          "text-emerald-600 font-medium",
                        runB.userCount - runA.userCount < 0 &&
                          "text-destructive font-medium"
                      )}
                    >
                      {runB.userCount - runA.userCount > 0
                        ? `+${runB.userCount - runA.userCount}`
                        : runB.userCount - runA.userCount < 0
                          ? `-${Math.abs(runB.userCount - runA.userCount)}`
                          : "0"}
                    </TableCell>
                    <TableCell className="text-right">—</TableCell>
                  </TableRow>

                  {/* 8 hàng chỉ số */}
                  {EVAL_METRICS.map((metric) => {
                    const valA =
                      runA.metrics?.[String(k)]?.[metric.key] ?? 0;
                    const valB =
                      runB.metrics?.[String(k)]?.[metric.key] ?? 0;
                    const diff = valB - valA;
                    const rDiff =
                      Math.round(diff * 10 ** metric.digits) /
                      10 ** metric.digits;
                    const changeText = formatSignedPercentChange(valA, valB);

                    return (
                      <TableRow key={metric.key}>
                        <TableCell className="font-medium">
                          {metric.header(k)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMetricValue(valA, metric.digits)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMetricValue(valB, metric.digits)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right",
                            rDiff > 0 && "text-emerald-600 font-medium",
                            rDiff < 0 && "text-destructive font-medium"
                          )}
                        >
                          {formatSignedDiff(diff, metric.digits)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right",
                            valA !== 0 &&
                              rDiff > 0 &&
                              "text-emerald-600 font-medium",
                            valA !== 0 &&
                              rDiff < 0 &&
                              "text-destructive font-medium"
                          )}
                        >
                          {changeText}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Bảng Tham số */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold tracking-tight">Tham số</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tham số</TableHead>
                    <TableHead>A</TableHead>
                    <TableHead>B</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paramKeys.map((key) => {
                    const valA = flatParamsA[key];
                    const valB = flatParamsB[key];
                    const isDiff = areParamValuesDifferent(valA, valB);

                    return (
                      <TableRow key={key}>
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span>{key}</span>
                            {isDiff && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0 h-4 text-amber-600 border-amber-300"
                              >
                                khác
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatParamValue(valA)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatParamValue(valB)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
