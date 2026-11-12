import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminListError } from "@/components/admin/admin-list-error";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardSummaryQueryOptions } from "@/lib/tanstack/options/dashboard";
import type { DashboardGroupBy } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";
import { ActivePlansCard } from "./active-plans-card";
import { addDays, DateRangeFilter, getToday } from "./date-range-filter";
import { KpiTiles } from "./kpi-tiles";
import { PlanRevenueCard } from "./plan-revenue-card";
import { PremiumRatioCard } from "./premium-ratio-card";
import { TopLutsCard } from "./top-luts-card";
import { TrendCard } from "./trend-card";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-[360px] w-full rounded-xl lg:col-span-2" />
        <Skeleton className="h-[360px] w-full rounded-xl lg:col-span-1" />
        <Skeleton className="h-[360px] w-full rounded-xl lg:col-span-2" />
        <div className="space-y-6 lg:col-span-1">
          <Skeleton className="h-[168px] w-full rounded-xl" />
          <Skeleton className="h-[168px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function DashboardView() {
  const today = React.useMemo(() => getToday(), []);
  const [params, setParams] = React.useState<{
    from: string;
    to: string;
    groupBy: DashboardGroupBy;
    selectedQuick: string | null;
  }>(() => ({
    from: addDays(today, -29),
    to: today,
    groupBy: "DAY",
    selectedQuick: "30 ngày"
  }));

  const { data, isFetching, isError, refetch } = useQuery(
    dashboardSummaryQueryOptions({
      from: params.from,
      to: params.to,
      groupBy: params.groupBy
    })
  );

  const handleRangeChange = (
    from: string,
    to: string,
    groupBy: DashboardGroupBy,
    quick: string | null
  ) => {
    setParams({ from, to, groupBy, selectedQuick: quick });
  };

  const handleGroupByChange = (groupBy: DashboardGroupBy) => {
    setParams((p) => ({ ...p, groupBy }));
  };

  return (
    <div className="space-y-6">
      <DateRangeFilter
        fromDate={params.from}
        toDate={params.to}
        selectedQuick={params.selectedQuick}
        previousFrom={data?.previous?.from}
        previousTo={data?.previous?.to}
        onRangeChange={handleRangeChange}
      />

      {isError ? (
        <AdminListError title="Không tải được số liệu" onRetry={() => void refetch()} />
      ) : !data ? (
        <DashboardSkeleton />
      ) : (
        <div
          className={cn("space-y-6 transition-opacity", isFetching && "opacity-60")}
          aria-busy={isFetching ? "true" : undefined}
        >
          <KpiTiles summary={data.summary} previous={data.previous} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <TrendCard
              series={data.series}
              summary={data.summary}
              groupBy={params.groupBy}
              onGroupByChange={handleGroupByChange}
            />
            <ActivePlansCard activePlans={data.activePlans} />
            <TopLutsCard topLuts={data.topLuts} />
            <div className="flex flex-col gap-6 lg:col-span-1">
              <PremiumRatioCard summary={data.summary} />
              <PlanRevenueCard revenueByPlan={data.revenueByPlan} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
