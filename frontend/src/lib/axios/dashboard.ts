import axiosInstance from "@/lib/axios/instance";
import type { ApiResponse } from "@/lib/types/common";
import type { DashboardSummaryDTO, DashboardSummaryParams } from "@/lib/types/dashboard";

export async function getDashboardSummary(
  params: DashboardSummaryParams = {}
): Promise<DashboardSummaryDTO> {
  const queryParams: Record<string, string> = {};
  if (params.from) queryParams.from = params.from;
  if (params.to) queryParams.to = params.to;
  if (params.groupBy) queryParams.groupBy = params.groupBy;

  const res = await axiosInstance.get<ApiResponse<DashboardSummaryDTO>>("/dashboard/summary", {
    params: queryParams
  });
  return res.data.result;
}
