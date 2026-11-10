import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { getAccountMe, loginShop, register } from "@/lib/axios/account";
import { logoutRemote } from "@/lib/axios/auth";
import { checkout, getPlans, requestLutDownload } from "@/lib/mock/account";
import { MOCK_PLANS } from "@/lib/mock/data/plans";
import { useAuthStore } from "@/lib/stores/auth";
import { useShopSession } from "@/lib/stores/shop-session";
import { queryClient } from "@/lib/tanstack/query-client";
import type { CheckoutRequest, LutDownloadDTO, ShopLoginRequest, ShopRegisterRequest, ShopUserDTO } from "@/lib/types/account";
import type { LutDTO } from "@/lib/types/lut";

export const plansQueryOptions = queryOptions({
  queryKey: ["plans"],
  queryFn: getPlans,
  staleTime: Infinity
});

/** GET /account/me — query lấy thông tin tài khoản hiện tại khi có token (plan §8). */
export const accountMeQueryOptions = queryOptions({
  queryKey: ["account-me"],
  queryFn: async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return null;
    return getAccountMe();
  },
  retry: false,
  staleTime: 0
});

/** Lỗi đăng nhập / đăng ký hiện ngay trong form (role="alert"), nên tắt toast lỗi */
export const loginMutationOptions = mutationOptions({
  mutationFn: async (req: ShopLoginRequest): Promise<ShopUserDTO> => {
    const res = await loginShop(req);
    useAuthStore.getState().set({
      accessToken: res.token,
      refreshToken: res.refreshToken,
      userId: res.userId,
      remember: true
    });
    const user = await getAccountMe();
    useShopSession.getState().setUser(user);
    return user;
  },
  meta: {
    successMessage: (u) => `Xin chào, ${(u as ShopUserDTO).name}`,
    silentError: true
  }
});

export const registerMutationOptions = mutationOptions({
  mutationFn: async (req: ShopRegisterRequest): Promise<ShopUserDTO> => {
    const res = await register(req);
    useAuthStore.getState().set({
      accessToken: res.token,
      refreshToken: res.refreshToken,
      userId: res.userId,
      remember: true
    });
    const user = await getAccountMe();
    useShopSession.getState().setUser(user);
    return user;
  },
  meta: {
    successMessage: (u) => `Đã tạo tài khoản, chào mừng ${(u as ShopUserDTO).name}`,
    silentError: true
  }
});

export const logoutMutationOptions = mutationOptions({
  mutationFn: async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    void logoutRemote(refreshToken);
    useAuthStore.getState().clear();
    useShopSession.getState().logout();
    queryClient.removeQueries({ queryKey: ["account-me"] });
  },
  meta: {
    successMessage: "Đã đăng xuất"
  }
});

export const checkoutMutationOptions = mutationOptions({
  mutationFn: ({ user, ...req }: CheckoutRequest & { user: ShopUserDTO }) => checkout(user, req),
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
