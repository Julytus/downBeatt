import { isAxiosError } from "axios";
import type { ErrorResponse } from "@/lib/types/common";

export interface ApiErrorDetails {
  status?: number;
  errorCode?: string;
  message?: string;
}

/**
 * Đọc thông tin lỗi từ phản hồi của API (status, errorCode, message).
 */
export function apiErrorOf(err: unknown): ApiErrorDetails {
  if (isAxiosError(err)) {
    const data = err.response?.data as Partial<ErrorResponse> | undefined;
    return {
      status: err.response?.status,
      errorCode: data?.errorCode,
      message: data?.message
    };
  }
  if (err && typeof err === "object") {
    const obj = err as { status?: number; errorCode?: string; message?: string };
    return {
      status: typeof obj.status === "number" ? obj.status : undefined,
      errorCode: typeof obj.errorCode === "string" ? obj.errorCode : undefined,
      message: typeof obj.message === "string" ? obj.message : undefined
    };
  }
  return {};
}
