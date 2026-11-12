import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DashboardGroupBy, DashboardPointDTO, DashboardTotalsDTO } from "@/lib/types/dashboard";
import { formatCompact, formatCount, formatDateDMY, formatPeriodLabel, formatVnd } from "./format";

type MetricKey = "revenue" | "paidOrders" | "newCustomers" | "downloads";

const METRIC_LABELS: Record<MetricKey, string> = {
  revenue: "Doanh thu",
  paidOrders: "Đơn đã thanh toán",
  newCustomers: "Khách mới",
  downloads: "Lượt tải"
};

const GROUP_LABELS: Record<DashboardGroupBy, string> = {
  DAY: "ngày",
  MONTH: "tháng"
};

interface TrendCardProps {
  series: DashboardPointDTO[];
  summary: DashboardTotalsDTO;
  groupBy: DashboardGroupBy;
  onGroupByChange: (groupBy: DashboardGroupBy) => void;
}

export function TrendCard({ series, summary, groupBy, onGroupByChange }: TrendCardProps) {
  const [metric, setMetric] = React.useState<MetricKey>("revenue");
  const [isTableOpen, setIsTableOpen] = React.useState(false);

  const isEmpty = series.length === 0 || series.every((p) => (p[metric] ?? 0) === 0);

  const formatXAxis = (val: string) => {
    const parts = val.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    if (parts.length === 2) return `${parts[1]}/${parts[0]}`;
    return val;
  };

  const formatYAxis = (val: number) => {
    if (metric === "revenue") {
      return formatCompact(val);
    }
    return formatCount(val);
  };

  const chartConfig = {
    [metric]: {
      label: METRIC_LABELS[metric],
      color: "var(--chart-1)"
    }
  } satisfies ChartConfig;

  return (
    <section aria-label="Diễn biến" className="lg:col-span-2">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
          <CardTitle className="text-base font-semibold">Diễn biến</CardTitle>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Tabs value={metric} onValueChange={(val) => setMetric(val as MetricKey)}>
              <TabsList aria-label="Chỉ số">
                <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
                <TabsTrigger value="paidOrders">Đơn đã thanh toán</TabsTrigger>
                <TabsTrigger value="newCustomers">Khách mới</TabsTrigger>
                <TabsTrigger value="downloads">Lượt tải</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs value={groupBy} onValueChange={(val) => onGroupByChange(val as DashboardGroupBy)}>
              <TabsList aria-label="Gom theo">
                <TabsTrigger value="DAY">Ngày</TabsTrigger>
                <TabsTrigger value="MONTH">Tháng</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {isEmpty ? (
            <div className="flex h-[260px] w-full items-center justify-center text-sm text-muted-foreground">
              Chưa có dữ liệu trong khoảng này.
            </div>
          ) : (
            <div
              role="img"
              aria-label={`Biểu đồ ${METRIC_LABELS[metric]} theo ${GROUP_LABELS[groupBy]}`}
              className="h-[260px] w-full"
            >
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <BarChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={formatXAxis}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={formatYAxis}
                    width={45}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(val) => formatPeriodLabel(String(val))}
                        formatter={(val) => (
                          <span className="font-semibold">
                            {metric === "revenue" ? formatVnd(Number(val)) : formatCount(Number(val))}
                          </span>
                        )}
                      />
                    }
                  />
                  <Bar dataKey={metric} fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          )}

          <Collapsible open={isTableOpen} onOpenChange={setIsTableOpen}>
            <div className="flex justify-end">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  {isTableOpen ? "Ẩn bảng số liệu" : "Xem bảng số liệu"}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="pt-3">
              <div className="max-h-[320px] overflow-y-auto overflow-x-auto rounded-md border">
                <Table aria-label="Bảng số liệu theo kỳ">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kỳ</TableHead>
                      <TableHead className="text-right">Doanh thu</TableHead>
                      <TableHead className="text-right">Đơn đã thanh toán</TableHead>
                      <TableHead className="text-right">Khách mới</TableHead>
                      <TableHead className="text-right">Lượt tải</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {series.map((item) => (
                      <TableRow key={item.period}>
                        <TableCell className="font-medium">{formatDateDMY(item.period)}</TableCell>
                        <TableCell className="text-right">{formatVnd(item.revenue)}</TableCell>
                        <TableCell className="text-right">{formatCount(item.paidOrders)}</TableCell>
                        <TableCell className="text-right">{formatCount(item.newCustomers)}</TableCell>
                        <TableCell className="text-right">{formatCount(item.downloads)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="font-bold">
                      <TableCell>Tổng</TableCell>
                      <TableCell className="text-right">{formatVnd(summary.revenue)}</TableCell>
                      <TableCell className="text-right">{formatCount(summary.paidOrders)}</TableCell>
                      <TableCell className="text-right">{formatCount(summary.newCustomers)}</TableCell>
                      <TableCell className="text-right">{formatCount(summary.downloads)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </section>
  );
}
