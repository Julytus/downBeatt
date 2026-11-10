import { create } from "zustand";
import type { BillingCycle, PlanCode } from "@/lib/types/account";
import type { LutDTO } from "@/lib/types/lut";

/**
 * Hộp thoại dùng chung của cửa hàng. Mở từ bất kỳ đâu (header, thẻ LUT, trang giá),
 * render một lần ở `ShopDialogs`.
 * - login / register: `lut` có giá trị khi mở vì bấm tải LUT (hiện thẻ LUT ở đầu hộp thoại),
 *   `plan` khi mở từ nút mua gói (đăng nhập xong chuyển sang thanh toán)
 * - upgrade: tài khoản miễn phí bấm tải LUT Premium
 * - checkout: xác nhận mua gói
 */
export type ShopDialog =
  | { type: "login"; lut?: LutDTO; plan?: Exclude<PlanCode, "free">; email?: string }
  | { type: "register"; lut?: LutDTO; plan?: Exclude<PlanCode, "free"> }
  | { type: "upgrade"; lut: LutDTO }
  | { type: "checkout"; plan: Exclude<PlanCode, "free">; cycle: BillingCycle; sourceLutId?: number };

interface ShopDialogState {
  dialog: ShopDialog | null;
  open: (dialog: ShopDialog) => void;
  close: () => void;
}

export const useShopDialog = create<ShopDialogState>()((set) => ({
  dialog: null,
  open: (dialog) => set({ dialog }),
  close: () => set({ dialog: null })
}));
