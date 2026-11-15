import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { getDashboardSummary } from "@/lib/axios/dashboard";
import type { DashboardSummaryParams } from "@/lib/types/dashboard";

export const DASHBOARD_QUERY_KEY = ["dashboard"] as const;

export const dashboardSummaryQueryOptions = ({
  from,
  to,
  groupBy
}: DashboardSummaryParams) =>
  queryOptions({
    queryKey: [...DASHBOARD_QUERY_KEY, "summary", from, to, groupBy],
    queryFn: () => getDashboardSummary({ from, to, groupBy }),
    staleTime: 30_000,
    placeholderData: keepPreviousData
  });
