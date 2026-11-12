import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { createRecommendStatsQueryOptions } from "@/lib/tanstack/options/recommend-admin";
import {
  VARIANT_STRATEGY_LABELS,
  formatVnNumber,
  formatVnPercent
} from "./labels";
import { PositionBars } from "./position-bars";
import { StatTile } from "./stat-tile";
import { TabLoadError } from "./tab-load-error";

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getToday(): string {
  return formatLocalDate(new Date());
}

function addDays(dayStr: string, n: number): string {
  const [y, m, d] = dayStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + n);
  return formatLocalDate(date);
}

function diffDays(from: string, to: string): number {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  const date1 = new Date(y1, m1 - 1, d1);
  const date2 = new Date(y2, m2 - 1, d2);
  return Math.round((date2.getTime() - date1.getTime()) / (1000 * 3600 * 24)) + 1;
}

export function OnlineTab() {
  const today = React.useMemo(() => getToday(), []);
  const [fromDate, setFromDate] = React.useState(() => addDays(today, -29));
  const [toDate, setToDate] = React.useState(() => today);
  const [quickDays, setQuickDays] = React.useState<number | null>(30);

  // Validate dates
  const fromError = React.useMemo(() => {
    if (!fromDate.trim()) {
      return "Chọn ngày";
    }
    return null;
  }, [fromDate]);

  const toError = React.useMemo(() => {
    if (!toDate.trim()) {
      return "Chọn ngày";
    }
    if (fromDate.trim()) {
      if (fromDate > toDate) {
        return "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc";
      }
      if (diffDays(fromDate, toDate) > 366) {
        return "Khoảng thời gian tối đa 366 ngày";
      }
    }
    return null;
  }, [fromDate, toDate]);

  const isValid = fromError === null && toError === null;

  const {
    data: stats,
    isLoading,
    isError,
    refetch
  } = useQuery({
    ...createRecommendStatsQueryOptions({ from: fromDate, to: toDate }),
    enabled: isValid
  });

  const handleQuick = (days: number) => {
    setQuickDays(days);
    const newTo = getToday();
    const newFrom = addDays(newTo, -(days - 1));
    setFromDate(newFrom);
    setToDate(newTo);
  };

  return (
    <div className="space-y-6">
      {/* Thanh lọc ngày */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="space-y-1">
            <Label htmlFor="stats-from">Từ ngày</Label>
            <Input
              id="stats-from"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setQuickDays(null);
              }}
              aria-invalid={!!fromError}
              aria-describedby={fromError ? "stats-from-error" : undefined}
              className="w-40"
            />
            {fromError && (
              <p id="stats-from-error" className="text-sm font-medium text-destructive">
                {fromError}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="stats-to">Đến ngày</Label>
            <Input
              id="stats-to"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setQuickDays(null);
              }}
              aria-invalid={!!toError}
              aria-describedby={toError ? "stats-to-error" : undefined}
              className="w-40"
            />
            {toError && (
              <p id="stats-to-error" className="text-sm font-medium text-destructive">
                {toError}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 pt-5 sm:pt-6">
            <Button
              type="button"
              variant={quickDays === 7 ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuick(7)}
            >
              7 ngày
            </Button>
            <Button
              type="button"
              variant={quickDays === 30 ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuick(30)}
            >
              30 ngày
            </Button>
            <Button
              type="button"
              variant={quickDays === 90 ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuick(90)}
            >
              90 ngày
            </Button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && <TabLoadError onRetry={() => void refetch()} />}

      {/* Loaded data */}
      {!isLoading && !isError && stats && (
        <>
          {/* 4 ô số: dưới lg xếp 2 cột (2 hàng x 2), từ lg xếp 4 cột */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile
              label="Lượt hiển thị"
              value={formatVnNumber(stats.summary.impressions)}
              subtitle="Mỗi lần khối gợi ý ở /luts trả danh sách"
            />
            <StatTile
              label="CTR"
              value={formatVnPercent(stats.summary.ctr)}
              subtitle={`${formatVnNumber(stats.summary.clicked)} lượt hiển thị có bấm`}
            />
            <StatTile
              label="Tỉ lệ tải"
              value={formatVnPercent(stats.summary.downloadRate)}
              subtitle={`${formatVnNumber(stats.summary.downloaded)} lượt có tải trong 30 phút sau khi bấm`}
            />
            <StatTile
              label="Tỉ lệ bỏ qua"
              value={formatVnPercent(stats.summary.dismissRate)}
              subtitle={`${formatVnNumber(stats.summary.dismissals)} lần Không quan tâm`}
            />
          </div>

          {/* Khi impressions = 0: hiện Empty */}
          {stats.summary.impressions === 0 ? (
            <div className="py-8">
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Chưa có lượt hiển thị gợi ý nào trong khoảng này.</EmptyTitle>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CTR theo vị trí */}
              <Card>
                <CardHeader>
                  <CardTitle>CTR theo vị trí</CardTitle>
                </CardHeader>
                <CardContent>
                  <PositionBars items={stats.byPosition} />
                </CardContent>
              </Card>

              {/* Theo biến thể */}
              <Card>
                <CardHeader>
                  <CardTitle>Theo biến thể</CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Biến thể</TableHead>
                        <TableHead>Loại khối</TableHead>
                        <TableHead className="text-right">Lượt hiển thị</TableHead>
                        <TableHead className="text-right">CTR</TableHead>
                        <TableHead className="text-right">Tỉ lệ tải</TableHead>
                        <TableHead className="text-right">Tỉ lệ bỏ qua</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.byVariant.map((v, idx) => (
                        <TableRow key={`${v.variant}-${v.strategy}-${idx}`}>
                          <TableCell className="font-medium">{v.variant}</TableCell>
                          <TableCell>{VARIANT_STRATEGY_LABELS[v.strategy] ?? v.strategy}</TableCell>
                          <TableCell className="text-right">{formatVnNumber(v.impressions)}</TableCell>
                          <TableCell className="text-right">{formatVnPercent(v.ctr)}</TableCell>
                          <TableCell className="text-right">{formatVnPercent(v.downloadRate)}</TableCell>
                          <TableCell className="text-right">{formatVnPercent(v.dismissRate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
