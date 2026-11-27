import type { UserAdminItem } from "@/lib/types/user-admin";

/** Người đang đăng nhập (từ /user/info). */
export interface CurrentAdmin {
  id?: number | null;
  isOperator?: number | null;
}

/**
 * Luật §5.7 phía giao diện (chỉ để ẩn / hiện, backend vẫn chặn): không thao tác chính mình;
 * tài khoản toàn quyền chỉ người toàn quyền mới thao tác được.
 */
export function canManageUser(me: CurrentAdmin | null | undefined, target: Pick<UserAdminItem, "id" | "isOperator">) {
  if (!me?.id) return false;
  if (me.id === target.id) return false;
  if (target.isOperator === 1 && me.isOperator !== 1) return false;
  return true;
}

export const isSelf = (me: CurrentAdmin | null | undefined, id: number) => !!me?.id && me.id === id;

/** Nhãn gói lúc tải: free → Miễn phí, pro → Pro, studio → Studio. */
export function planCodeLabel(code?: string | null) {
  switch (code) {
    case "free":
      return "Miễn phí";
    case "pro":
      return "Pro";
    case "studio":
      return "Studio";
    default:
      return code ?? "";
  }
}
