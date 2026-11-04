import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ShopUserDTO } from "@/lib/types/account";

interface ShopSessionState {
  user: ShopUserDTO | null;
  setUser: (user: ShopUserDTO) => void;
  logout: () => void;
}

/**
 * Phiên đăng nhập của khách hàng ở cửa hàng (tách khỏi `useAuthStore` của trang quản trị).
 * Hiện là dữ liệu giả; khi có backend sẽ lưu token như `useAuthStore` và lấy user từ /api/account/me.
 */
export const useShopSession = create<ShopSessionState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null })
    }),
    { name: "downbeat-shop-session", storage: createJSONStorage(() => localStorage) }
  )
);

/** Gói hiện tại có tải được LUT Premium không */
export const canDownloadPremium = (user: ShopUserDTO | null) => !!user && user.plan !== "free";
