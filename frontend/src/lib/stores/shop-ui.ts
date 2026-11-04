import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ShopUiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

/** Trạng thái giao diện khu cửa hàng, nhớ giữa các lần mở (chỉ là tiện ích, mất cũng không sao). */
export const useShopUiStore = create<ShopUiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }))
    }),
    { name: "downbeat-shop-ui", storage: createJSONStorage(() => localStorage) }
  )
);
