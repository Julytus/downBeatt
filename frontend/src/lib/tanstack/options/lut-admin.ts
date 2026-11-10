import { keepPreviousData, queryOptions, type MutationOptions, type QueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import {
  deleteLut,
  getLutAdmin,
  getLutAdminList,
  getLutCreators,
  hideLut,
  publishLut,
  uploadLutFile,
  upsertLut
} from "@/lib/axios/lut-admin";
import { LUT_FEATURES_QUERY_KEY } from "@/lib/tanstack/options/lut-feature";
import type { ErrorResponse } from "@/lib/types/common";
import {
  LUT_UPLOAD_RULES,
  type LutAdminDetailDTO,
  type LutAdminListApiRequest,
  type LutUploadKind,
  type LutUpsertApiRequest
} from "@/lib/types/lut-admin";

export const LUT_ADMIN_QUERY_KEY = ["lut-admin"] as const;

export const createLutAdminListQueryOptions = (req: LutAdminListApiRequest) =>
  queryOptions({
    queryKey: [...LUT_ADMIN_QUERY_KEY, "list", req],
    queryFn: () => getLutAdminList(req),
    placeholderData: keepPreviousData
  });

export const createLutAdminDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: [...LUT_ADMIN_QUERY_KEY, "detail", id],
    queryFn: () => getLutAdmin(id)
  });

export const lutCreatorsQueryOptions = queryOptions({
  queryKey: [...LUT_ADMIN_QUERY_KEY, "creators"],
  queryFn: getLutCreators,
  staleTime: 60_000
});

export const createUpsertLutMutationOptions = (
  isEdit: boolean,
  queryClient?: QueryClient
): MutationOptions<LutAdminDetailDTO, AxiosError<ErrorResponse>, LutUpsertApiRequest> => ({
  mutationKey: [...LUT_ADMIN_QUERY_KEY, "upsert"],
  mutationFn: upsertLut,
  meta: {
    invalidatesQuery: [LUT_ADMIN_QUERY_KEY, LUT_FEATURES_QUERY_KEY],
    successMessage: isEdit ? "Đã lưu LUT" : "Đã tạo LUT nháp",
    errorMessage: isEdit ? "Không lưu được LUT" : "Không tạo được LUT"
  },
  onSuccess: (data) => {
    if (queryClient && data?.id) {
      queryClient.setQueryData([...LUT_ADMIN_QUERY_KEY, "detail", data.id], data);
    }
  }
});

export const deleteLutMutationOptions: MutationOptions<
  number,
  AxiosError<ErrorResponse>,
  number
> = {
  mutationKey: [...LUT_ADMIN_QUERY_KEY, "delete"],
  mutationFn: deleteLut,
  meta: {
    invalidatesQuery: [LUT_ADMIN_QUERY_KEY, LUT_FEATURES_QUERY_KEY],
    successMessage: "Đã xoá LUT",
    errorMessage: "Không xoá được LUT"
  }
};

export const createUploadLutFileMutationOptions = (
  queryClient: QueryClient,
  kind: LutUploadKind
): MutationOptions<LutAdminDetailDTO, AxiosError<ErrorResponse>, { id: number; file: File }> => ({
  mutationKey: [...LUT_ADMIN_QUERY_KEY, "upload", kind],
  mutationFn: ({ id, file }) => uploadLutFile(id, kind, file),
  meta: {
    invalidatesQuery: [LUT_ADMIN_QUERY_KEY, LUT_FEATURES_QUERY_KEY],
    successMessage: LUT_UPLOAD_RULES[kind].successToast,
    errorMessage: "Không tải lên được file"
  },
  onSuccess: (data) => {
    queryClient.setQueryData([...LUT_ADMIN_QUERY_KEY, "detail", data.id], data);
  }
});

export const createPublishLutMutationOptions = (
  queryClient: QueryClient
): MutationOptions<LutAdminDetailDTO, AxiosError<ErrorResponse>, number> => ({
  mutationKey: [...LUT_ADMIN_QUERY_KEY, "publish"],
  mutationFn: publishLut,
  meta: {
    invalidatesQuery: [LUT_ADMIN_QUERY_KEY, LUT_FEATURES_QUERY_KEY],
    successMessage: "Đã xuất bản LUT",
    errorMessage: "Không xuất bản được LUT"
  },
  onSuccess: (data) => {
    queryClient.setQueryData([...LUT_ADMIN_QUERY_KEY, "detail", data.id], data);
  }
});

export const createHideLutMutationOptions = (
  queryClient: QueryClient
): MutationOptions<LutAdminDetailDTO, AxiosError<ErrorResponse>, number> => ({
  mutationKey: [...LUT_ADMIN_QUERY_KEY, "hide"],
  mutationFn: hideLut,
  meta: {
    invalidatesQuery: [LUT_ADMIN_QUERY_KEY, LUT_FEATURES_QUERY_KEY],
    successMessage: "Đã ẩn LUT",
    errorMessage: "Không ẩn được LUT"
  },
  onSuccess: (data) => {
    queryClient.setQueryData([...LUT_ADMIN_QUERY_KEY, "detail", data.id], data);
  }
});
