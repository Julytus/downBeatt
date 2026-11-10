import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth";
import { useShopSession } from "@/lib/stores/shop-session";
import { accountMeQueryOptions } from "@/lib/tanstack/options/account";

/**
 * Đồng bộ phiên đăng nhập cửa hàng với `useAuthStore` (plan §8, TC-21, TC-28).
 * - Có accessToken mà chưa có user: bật loading, gọi GET /account/me; xong thì setUser, lỗi thì user = null, tắt loading.
 * - Token về null (đăng xuất ở /admin, hết phiên): logout() để dọn dẹp state cửa hàng.
 */
export function ShopSessionSync() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useShopSession((s) => s.user);
  const setUser = useShopSession((s) => s.setUser);
  const setLoading = useShopSession((s) => s.setLoading);
  const logout = useShopSession((s) => s.logout);

  const { data, isError, isLoading, isFetching } = useQuery({
    ...accountMeQueryOptions,
    enabled: Boolean(accessToken && !user)
  });

  useEffect(() => {
    if (!accessToken) {
      logout();
      return;
    }

    if (user) {
      setLoading(false);
      return;
    }

    if (isLoading || isFetching) {
      setLoading(true);
    } else if (data) {
      setUser(data);
      setLoading(false);
    } else if (isError) {
      setUser(null);
      setLoading(false);
    }
  }, [accessToken, user, data, isError, isLoading, isFetching, setUser, setLoading, logout]);

  return null;
}
