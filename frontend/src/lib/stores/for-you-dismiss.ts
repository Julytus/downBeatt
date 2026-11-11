import { create } from "zustand";
import { dismissLutMutationOptions } from "@/lib/tanstack/options/recommend";
import { queryClient } from "@/lib/tanstack/query-client";

interface ForYouDismissState {
  /** Các LUT đang trong 5 giây chờ hoàn tác */
  hidden: Record<number, true>;
  /** Các LUT đã gửi dismiss thành công, lọc khỏi hàng tới hết phiên */
  removed: Record<number, true>;
  hide: (lutId: number, impressionId?: number) => void;
  undo: (lutId: number) => void;
  clear: () => void;
}

const timers = new Map<number, ReturnType<typeof setTimeout>>();

/**
 * Quản lý trạng thái "Không quan tâm" và "Hoàn tác" của khối gợi ý (plan §6.2 / §8 mục 6).
 * Hẹn giờ 5 giây đặt trong Map module độc lập với vòng đời component.
 */
export const useForYouDismissStore = create<ForYouDismissState>()((set) => ({
  hidden: {},
  removed: {},

  hide: (lutId: number, impressionId?: number) => {
    const existing = timers.get(lutId);
    if (existing) {
      clearTimeout(existing);
      timers.delete(lutId);
    }

    set((state) => ({
      hidden: { ...state.hidden, [lutId]: true }
    }));

    const timer = setTimeout(async () => {
      timers.delete(lutId);
      try {
        await queryClient
          .getMutationCache()
          .build(queryClient, dismissLutMutationOptions)
          .execute({ lutId, impressionId });

        set((state) => {
          const nextHidden = { ...state.hidden };
          delete nextHidden[lutId];
          return {
            hidden: nextHidden,
            removed: { ...state.removed, [lutId]: true }
          };
        });
      } catch {
        set((state) => {
          const nextHidden = { ...state.hidden };
          delete nextHidden[lutId];
          return { hidden: nextHidden };
        });
      }
    }, 5000);

    timers.set(lutId, timer);
  },

  undo: (lutId: number) => {
    const timer = timers.get(lutId);
    if (timer) {
      clearTimeout(timer);
      timers.delete(lutId);
    }
    set((state) => {
      const nextHidden = { ...state.hidden };
      delete nextHidden[lutId];
      return { hidden: nextHidden };
    });
  },

  clear: () => {
    for (const timer of timers.values()) {
      clearTimeout(timer);
    }
    timers.clear();
    set({ hidden: {}, removed: {} });
  }
}));
