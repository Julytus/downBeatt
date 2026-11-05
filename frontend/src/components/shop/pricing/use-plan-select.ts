import { useNavigate } from "@tanstack/react-router";
import { useShopDialog } from "@/lib/stores/shop-dialog";
import { useShopSession } from "@/lib/stores/shop-session";
import type { BillingCycle, PlanDTO } from "@/lib/types/account";

export function usePlanSelect(cycle: BillingCycle) {
  const user = useShopSession((s) => s.user);
  const openDialog = useShopDialog((s) => s.open);
  const navigate = useNavigate();

  const select = (plan: PlanDTO) => {
    if (plan.code === "free") {
      if (!user) openDialog({ type: "register" });
      else navigate({ to: "/luts" });
      return;
    }
    if (!user) openDialog({ type: "register", plan: plan.code });
    else openDialog({ type: "checkout", plan: plan.code, cycle });
  };

  const ctaLabel = (plan: PlanDTO) =>
    plan.code === "free" ? (user ? "Vào kho LUT" : "Bắt đầu miễn phí") : `Chọn gói ${plan.name}`;

  return { select, ctaLabel, user };
}
