import { useNavigate } from "@tanstack/react-router";
import { useShopDialog } from "@/lib/stores/shop-dialog";
import { useShopSession } from "@/lib/stores/shop-session";
import type { BillingCycle, PlanDTO } from "@/lib/types/account";
import { planAction } from "@/lib/utils/plan";

export function usePlanSelect(cycle: BillingCycle) {
  const user = useShopSession((s) => s.user);
  const openDialog = useShopDialog((s) => s.open);
  const navigate = useNavigate();

  const select = (plan: PlanDTO) => {
    const action = planAction(user, plan);
    if (action.disabled) return;

    if (plan.code === "free") {
      if (!user) openDialog({ type: "register" });
      else navigate({ to: "/luts" });
      return;
    }

    if (!user) {
      openDialog({ type: "register", plan: plan.code });
      return;
    }

    openDialog({ type: "checkout", plan: plan.code, cycle });
  };

  return { select, user };
}
