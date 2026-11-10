import { keepPreviousData, queryOptions, type MutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { getLutFeatureList, recomputeLutFeatures } from "@/lib/axios/lut-feature";
import type { ErrorResponse } from "@/lib/types/common";
import type {
  LutFeatureItemDTO,
  LutFeatureListApiRequest
} from "@/lib/types/lut-feature";

export const LUT_FEATURES_QUERY_KEY = ["lut-features"] as const;

export const createLutFeatureListQueryOptions = (req: LutFeatureListApiRequest) =>
  queryOptions({
    queryKey: [...LUT_FEATURES_QUERY_KEY, "list", req],
    queryFn: () => getLutFeatureList(req),
    placeholderData: keepPreviousData
  });

export const recomputeLutFeaturesMutationOptions: MutationOptions<
  LutFeatureItemDTO[],
  AxiosError<ErrorResponse>,
  number[]
> = {
  mutationKey: [...LUT_FEATURES_QUERY_KEY, "recompute"],
  mutationFn: recomputeLutFeatures,
  meta: {
    invalidatesQuery: [LUT_FEATURES_QUERY_KEY],
    successMessage: (data) => {
      const items = (data ?? []) as LutFeatureItemDTO[];
      const successCount = items.filter((item) => !item.featureError).length;
      const errorCount = items.filter((item) => !!item.featureError).length;
      if (errorCount > 0) {
        return `Đã tính lại đặc trưng màu cho ${successCount} LUT, ${errorCount} LUT lỗi`;
      }
      return `Đã tính lại đặc trưng màu cho ${successCount} LUT`;
    },
    errorMessage: "Không tính lại được đặc trưng màu"
  }
};
