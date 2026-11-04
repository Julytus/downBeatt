import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { checkout, getPlans, login, logout, register, requestLutDownload } from "@/lib/mock/account";
import { MOCK_PLANS } from "@/lib/mock/data/plans";
import type { CheckoutRequest, LutDownloadDTO, ShopUserDTO } from "@/lib/types/account";
import type { LutDTO } from "@/lib/types/lut";

export const plansQueryOptions = queryOptions({
  queryKey: ["plans"],
  queryFn: getPlans,
  staleTime: Infinity
});

/** Lỗi đăng nhập / đăng ký hiện ngay trong form (role="alert"), nên tắt toast lỗi */
export const loginMutationOptions = mutationOptions({
  mutationFn: login,
  meta: { successMessage: (u) => `Xin chào, ${(u as ShopUserDTO).name}`, silentError: true }
});

export const registerMutationOptions = mutationOptions({
  mutationFn: register,
  meta: { successMessage: (u) => `Đã tạo tài khoản, chào mừng ${(u as ShopUserDTO).name}`, silentError: true }
});

export const logoutMutationOptions = mutationOptions({
  mutationFn: logout,
  meta: { successMessage: "Đã đăng xuất" }
});

export const checkoutMutationOptions = mutationOptions({
  mutationFn: ({ userId, ...req }: CheckoutRequest & { userId: string }) => checkout(userId, req),
  meta: {
    successMessage: (u) =>
      `Đã nâng cấp lên gói ${MOCK_PLANS.find((p) => p.code === (u as ShopUserDTO).plan)?.name ?? ""}`,
    errorMessage: "Thanh toán không thành công, vui lòng thử lại"
  }
});

export const lutDownloadMutationOptions = mutationOptions({
  mutationFn: ({ lut, user }: { lut: LutDTO; user: ShopUserDTO | null }) => requestLutDownload(lut, user),
  meta: {
    successMessage: (d) => `Đã tải ${(d as LutDownloadDTO).fileName}`,
    errorMessage: "Không tải được LUT, vui lòng thử lại"
  }
});
