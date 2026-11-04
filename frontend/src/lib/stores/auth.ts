import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId?: number | null;
  /** true: lưu localStorage (giữ sau khi đóng trình duyệt); false: sessionStorage (mất khi đóng tab). */
  remember: boolean;
  set: (data: {
    accessToken: string | null;
    refreshToken: string | null;
    userId?: number | null;
    remember?: boolean;
  }) => void;
  clear: () => void;
}

/**
 * Đọc ở cả 2 nơi; ghi vào localStorage hoặc sessionStorage tuỳ cờ `remember` và xoá bản ở nơi còn lại.
 * Mọi thao tác storage bọc try/catch: chế độ ẩn danh / chặn storage không làm hỏng ứng dụng.
 */
const authStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name) ?? sessionStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      const remember = (JSON.parse(value) as { state?: { remember?: boolean } }).state?.remember;
      const [target, other] =
        remember === false ? [sessionStorage, localStorage] : [localStorage, sessionStorage];
      target.setItem(name, value);
      other.removeItem(name);
    } catch {
      // bỏ qua
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
      sessionStorage.removeItem(name);
    } catch {
      // bỏ qua
    }
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      remember: true,

      // Refresh token giữ nguyên lựa chọn `remember` của lần đăng nhập
      set: ({ accessToken, refreshToken, userId, remember }) =>
        set((state) => ({ accessToken, refreshToken, userId, remember: remember ?? state.remember })),

      clear: () =>
        set(() => ({
          accessToken: null,
          refreshToken: null,
          userId: null
        }))
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => authStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        userId: state.userId,
        remember: state.remember
      })
    }
  )
);
