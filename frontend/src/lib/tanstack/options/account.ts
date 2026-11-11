import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { getAccountMe, getPreference, loginShop, register, savePreference } from "@/lib/axios/account";
import { logoutRemote } from "@/lib/axios/auth";
import { requestLutDownload } from "@/lib/axios/luts";
import { mergeAnon } from "@/lib/axios/recommend";
import { getAnonId } from "@/lib/recommend/anon-id";
import { useAuthStore } from "@/lib/stores/auth";
import { useShopSession } from "@/lib/stores/shop-session";
import { queryClient } from "@/lib/tanstack/query-client";
import type { ShopLoginRequest, ShopRegisterRequest, ShopUserDTO } from "@/lib/types/account";
import type { LutDTO } from "@/lib/types/lut";

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
    void mergeAnon(getAnonId()).catch(() => undefined);
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
    void mergeAnon(getAnonId()).catch(() => undefined);
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

export const lutDownloadMutationOptions = mutationOptions({
  mutationFn: ({ lut }: { lut: LutDTO; user?: ShopUserDTO | null }) => requestLutDownload(lut.id),
  meta: {
    silentError: true
  }
});

/** GET /account/preference — query lấy sở thích màu đã lưu (plan §5.1, §8). */
export const preferenceQueryOptions = queryOptions({
  queryKey: ["account-preference"],
  queryFn: () => getPreference(),
  staleTime: 0,
  retry: false
});

/** POST /account/preference — lưu sở thích màu (plan §5.2, §8). */
export const savePreferenceMutationOptions = mutationOptions({
  mutationKey: ["account-preference", "save"],
  mutationFn: (categorySlugs: string[]) => savePreference(categorySlugs),
  meta: {
    successMessage: "Đã lưu sở thích màu",
    invalidatesQuery: [["account-preference"]]
  }
});
