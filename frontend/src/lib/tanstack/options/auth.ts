import { forgotPassword, getMe, getPermissionResources, login, resetPassword } from "@/lib/axios/auth";
import type {
  ForgotPasswordApiRequest,
  ResetPasswordApiRequest,
  LoginApiRequest,
  LoginResponseDTO
} from "@/lib/types/auth";
import { useAuthStore } from "@/lib/stores/auth";
import type { ErrorResponse } from "@/lib/types/common";
import { queryOptions, type MutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";

export const createLoginMutationOptions = (): MutationOptions<
  LoginResponseDTO,
  AxiosError<ErrorResponse>,
  LoginApiRequest
> => {
  return {
    mutationKey: ["login"],
    mutationFn: async (data: LoginApiRequest) => {
      return await login(data);
    },
    meta: {
      successMessage: "Đăng nhập thành công",
      invalidatesQuery: [["me"]]
    }
  };
};

export const createForgotPasswordMutationOptions = (): MutationOptions<
  string,
  AxiosError<ErrorResponse>,
  ForgotPasswordApiRequest
> => ({
  mutationKey: ["forgot-password"],
  mutationFn: forgotPassword
});

export const createResetPasswordMutationOptions = (): MutationOptions<
  string,
  AxiosError<ErrorResponse>,
  ResetPasswordApiRequest
> => ({
  mutationKey: ["reset-password"],
  mutationFn: resetPassword,
  meta: {
    successMessage: "Đặt lại mật khẩu thành công, vui lòng đăng nhập"
  }
});

export const meQueryOptions = queryOptions({
  queryKey: ["me"],
  // Không có token thì coi như chưa đăng nhập: tránh /user/info còn sống nhờ cookie
  // (withCredentials) hoặc request đang bay làm `me` hiện lại sau khi đăng xuất.
  queryFn: async () => (useAuthStore.getState().accessToken ? await getMe() : null),
  staleTime: 0,
  gcTime: 0,
  // Thử lại 1 lần (mặc định 3 lần với chờ tăng dần = ~10s treo ở màn "Đang tải" khi backend lỗi)
  retry: 1
});

/** Quyền của người đăng nhập (dựng menu / ẩn nút). Backend vẫn chặn ở API. */
export const permissionResourceQueryOptions = () =>
  queryOptions({
    queryKey: ["permission-resource"],
    queryFn: getPermissionResources,
    enabled: !!useAuthStore.getState().accessToken
  });
