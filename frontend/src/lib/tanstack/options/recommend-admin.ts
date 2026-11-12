import { keepPreviousData, queryOptions, type MutationOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
  getRecommendConfig,
  getRecommendStats,
  getEvalRun,
  listEvalRuns,
  rebuildRecommendIndex,
  searchRecommendCustomers,
  tryProfile
} from "@/lib/axios/recommend-admin";
import type { ErrorResponse } from "@/lib/types/common";
import type {
  EvalListParams,
  RebuildResultDTO,
  RecommendStatsParams,
  TryProfileRequest,
  TryProfileResultDTO
} from "@/lib/types/recommend";

export const RECOMMEND_ADMIN_QUERY_KEY = ["recommend-admin"] as const;

export const recommendConfigQueryOptions = queryOptions({
  queryKey: [...RECOMMEND_ADMIN_QUERY_KEY, "config"] as const,
  queryFn: () => getRecommendConfig(),
  staleTime: 30_000
});

export const createRecommendStatsQueryOptions = (params: RecommendStatsParams = {}) => {
  const { from = "", to = "" } = params;
  return queryOptions({
    queryKey: [...RECOMMEND_ADMIN_QUERY_KEY, "stats", from, to] as const,
    queryFn: () => getRecommendStats({ from, to }),
    placeholderData: keepPreviousData
  });
};

export const createRecommendCustomersQueryOptions = (keyword?: string) =>
  queryOptions({
    queryKey: [...RECOMMEND_ADMIN_QUERY_KEY, "customers", keyword ?? ""] as const,
    queryFn: () => searchRecommendCustomers(keyword),
    staleTime: 30_000
  });

export const rebuildIndexMutationOptions: MutationOptions<
  RebuildResultDTO,
  AxiosError<ErrorResponse>,
  void
> = {
  mutationKey: [...RECOMMEND_ADMIN_QUERY_KEY, "rebuild"],
  mutationFn: rebuildRecommendIndex,
  meta: {
    invalidatesQuery: [[...RECOMMEND_ADMIN_QUERY_KEY, "config"]],
    errorMessage: "Không dựng được chỉ mục gợi ý"
  }
};

export const tryProfileMutationOptions: MutationOptions<
  TryProfileResultDTO,
  AxiosError<ErrorResponse>,
  TryProfileRequest
> = {
  mutationKey: [...RECOMMEND_ADMIN_QUERY_KEY, "try-profile"],
  mutationFn: tryProfile,
  meta: {
    silentError: true
  }
};

export const createEvalRunsQueryOptions = (params: EvalListParams = {}) => {
  const algorithm = params.algorithm?.trim() ?? "";
  const scenario = params.scenario?.trim() ?? "";
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return queryOptions({
    queryKey: [...RECOMMEND_ADMIN_QUERY_KEY, "eval", "list", algorithm, scenario, page, limit] as const,
    queryFn: () =>
      listEvalRuns({
        algorithm: algorithm || undefined,
        scenario: scenario || undefined,
        page,
        limit
      }),
    placeholderData: keepPreviousData
  });
};

export const createEvalRunQueryOptions = (id: number) =>
  queryOptions({
    queryKey: [...RECOMMEND_ADMIN_QUERY_KEY, "eval", "get", id] as const,
    queryFn: () => getEvalRun(id),
    retry: (failureCount, error) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    }
  });

