import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

interface ShopUiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Bỏ qua nếu storage bị chặn (TC-34)
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Bỏ qua
    }
  }
};

/** Trạng thái giao diện khu cửa hàng, nhớ giữa các lần mở (chỉ là tiện ích, mất cũng không sao). */
export const useShopUiStore = create<ShopUiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }))
    }),
    { name: "downbeat-shop-ui", storage: createJSONStorage(() => safeLocalStorage) }
  )
);
