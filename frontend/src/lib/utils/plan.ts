import type { PlanDTO, ShopUserDTO } from "@/lib/types/account";

/** Lấy ngày hiện tại theo giờ Asia/Ho_Chi_Minh dạng ISO "YYYY-MM-DD". */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
}

/**
 * Định dạng ngày dd/MM/yyyy có đệm số 0 (plan §6).
 * Tách trực tiếp chuỗi "YYYY-MM-DD" từ API để không bị lệch múi giờ UTC.
 */
export function formatPlanDate(iso?: string | null): string {
  if (!iso) return "";
  const datePart = iso.split(/[T ]/)[0];
  const parts = datePart.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  return iso;
}

/**
 * Tính số ngày còn lại của gói tính từ today (mặc định hôm nay).
 * Trả undefined nếu không có hạn.
 */
export function daysLeft(planExpiresAt?: string | null, today = todayIso()): number | undefined {
  if (!planExpiresAt) return undefined;
  const expIso = planExpiresAt.split(/[T ]/)[0];
  const todayDateIso = today.split(/[T ]/)[0];
  const [ey, em, ed] = expIso.split("-").map(Number);
  const [ty, tm, td] = todayDateIso.split("-").map(Number);
  if (isNaN(ey) || isNaN(em) || isNaN(ed) || isNaN(ty) || isNaN(tm) || isNaN(td)) {
    return undefined;
  }
  const expUtc = Date.UTC(ey, em - 1, ed);
  const todayUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((expUtc - todayUtc) / 86_400_000);
}

export interface PlanAction {
  label: string;
  disabled: boolean;
  isCurrent: boolean;
  isLink?: boolean;
  href?: string;
}

/**
 * Xác định nhãn nút và trạng thái theo bảng §6.1:
 * | Trạng thái khách | Thẻ Miễn phí | Thẻ gói đang dùng | Thẻ gói cao hơn | Thẻ gói thấp hơn |
 */
export function planAction(user: ShopUserDTO | null | undefined, plan: PlanDTO): PlanAction {
  // Chưa đăng nhập
  if (!user) {
    if (plan.code === "free") {
      return { label: "Bắt đầu miễn phí", disabled: false, isCurrent: false };
    }
    return { label: `Chọn gói ${plan.name}`, disabled: false, isCurrent: false };
  }

  // Khách đang gói Miễn phí
  if (user.plan === "free") {
    if (plan.code === "free") {
      return { label: "Vào kho LUT", disabled: false, isCurrent: false, isLink: true, href: "/luts" };
    }
    return { label: `Chọn gói ${plan.name}`, disabled: false, isCurrent: false };
  }

  // Thẻ Miễn phí khi đang có gói trả phí
  if (plan.code === "free") {
    return { label: "Vào kho LUT", disabled: false, isCurrent: false, isLink: true, href: "/luts" };
  }

  const days = daysLeft(user.planExpiresAt);
  const isExpiringSoon = days !== undefined && days <= 3;

  // Thẻ gói đang dùng (Pro khi đang Pro, Studio khi đang Studio)
  if (plan.code === user.plan) {
    return {
      label: `Gia hạn gói ${plan.name}`,
      disabled: false,
      isCurrent: true
    };
  }

  // Khi đang dùng Pro:
  if (user.plan === "pro") {
    // Thẻ Studio (gói cao hơn)
    if (plan.code === "studio") {
      return { label: "Nâng cấp lên Studio", disabled: false, isCurrent: false };
    }
  }

  // Khi đang dùng Studio:
  if (user.plan === "studio") {
    // Thẻ Pro (gói thấp hơn)
    if (plan.code === "pro") {
      if (isExpiringSoon) {
        return { label: "Chọn gói Pro", disabled: false, isCurrent: false };
      }
      return { label: "Đã có trong gói Studio", disabled: true, isCurrent: false };
    }
  }

  return { label: `Chọn gói ${plan.name}`, disabled: false, isCurrent: false };
}
