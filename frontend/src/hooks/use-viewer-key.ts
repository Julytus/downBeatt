import { useShopSession } from "@/lib/stores/shop-session";

/**
 * Hook trả về định danh của người xem để làm khoá cache query gợi ý / related.
 * - Đã đăng nhập: "u:" + user.id
 * - Vãng lai: "anon"
 * ready = false khi phiên đăng nhập đang được khôi phục (/account/me).
 */
export function useViewerKey(): { key: string; ready: boolean } {
  const user = useShopSession((s) => s.user);
  const loading = useShopSession((s) => s.loading);

  const key = user ? `u:${user.id}` : "anon";
  const ready = !loading;

  return { key, ready };
}
