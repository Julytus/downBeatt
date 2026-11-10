import { create } from "zustand";
import { useAuthStore } from "@/lib/stores/auth";
import type { ShopUserDTO } from "@/lib/types/account";

// Xoá khoá cũ trong localStorage của bản mock trước đây (plan §8)
try {
  localStorage.removeItem("downbeat-shop-session");
} catch {
  // Bỏ qua nếu storage bị chặn
}

interface ShopSessionState {
  user: ShopUserDTO | null;
  loading: boolean;
  setUser: (user: ShopUserDTO | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

/**
 * Phiên đăng nhập của khách hàng ở cửa hàng.
 * Token nằm ở `useAuthStore` (dùng chung với trang quản trị);
 * `useShopSession` chỉ giữ thông tin người dùng trong bộ nhớ từ /account/me.
 */
export const useShopSession = create<ShopSessionState>()((set) => ({
  user: null,
  // Lần nạp đầu có token thì loading = true ngay từ render đầu (TC-21)
  loading: Boolean(useAuthStore.getState().accessToken),
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ user: null, loading: false })
}));

/** Gói hiện tại có tải được LUT Premium không */
export const canDownloadPremium = (user: ShopUserDTO | null) => !!user && user.plan !== "free";
