import { AxiosError } from "axios";

/** Body lỗi của backend (GlobalExceptionHandler / ApiErrorResponse). */
export interface ErrorResponse {
  path?: string;
  code: number;
  /** Mã lỗi ổn định để code phía client rẽ nhánh, vd "WEAK_PASSWORD", "IDEMPOTENCY_KEY_REUSED". */
  errorCode?: string;
  message: string;
}

/** Message lỗi từ backend; undefined nếu không phải lỗi HTTP có body (mạng, timeout...). */
export function getServerErrorMessage(err: unknown): string | undefined {
  if (err instanceof AxiosError && err.response?.data) {
    return (err.response.data as Partial<ErrorResponse>).message || undefined;
  }
  return undefined;
}

/** Mã lỗi từ backend (ví dụ "COLLECTION_NAME_EXISTS", "COLLECTION_LIMIT"). */
export function getServerErrorCode(err: unknown): string | undefined {
  if (err instanceof AxiosError && err.response?.data) {
    return (err.response.data as Partial<ErrorResponse>).errorCode;
  }
  return undefined;
}

export function ErrorResponseWarper(err: unknown, fallback = "Đã có lỗi xảy ra"): string {
  return getServerErrorMessage(err) ?? (err instanceof Error ? err.message : fallback);
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface PagedResult<T> {
  total: number;
  page: number;
  items: T[];
}

export type Prettify<T> = {
  [K in keyof T]: T[K];
} extends infer O
  ? { [K in keyof O]: O[K] }
  : never;

export type DeleteResponse = Prettify<ApiResponse<number>>;
export type VoidResponse = Prettify<ApiResponse<null>>;
