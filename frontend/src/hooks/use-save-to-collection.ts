import { useCallback } from "react";
import { useShopDialog } from "@/lib/stores/shop-dialog";
import { useShopSession } from "@/lib/stores/shop-session";
import type { LutDTO } from "@/lib/types/lut";

/**
 * Hook mở hộp thoại lưu LUT vào bộ sưu tập (plan §6.1).
 * Chưa đăng nhập → mở hộp thoại đăng ký kèm then: "collection".
 * Đã đăng nhập → mở hộp thoại lưu vào bộ sưu tập.
 */
export function useSaveToCollection() {
  const openDialog = useShopDialog((s) => s.open);

  const open = useCallback(
    (lut: LutDTO) => {
      const user = useShopSession.getState().user;
      if (!user) {
        openDialog({ type: "register", lut, then: "collection" });
      } else {
        openDialog({ type: "collection", lut });
      }
    },
    [openDialog]
  );

  return { open };
}
