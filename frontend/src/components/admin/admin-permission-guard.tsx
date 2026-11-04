import type { ReactNode } from "react";

import { AdminAccessDenied } from "@/components/admin/admin-access-denied";
import { AdminLoading } from "@/components/admin/admin-loading";
import { useCanView } from "@/hooks/use-can-view";

/** Bọc trang quản trị: không có quyền VIEW của resource `code` thì hiện trang từ chối truy cập. */
export function AdminPermissionGuard({ code, children }: { code: string; children: ReactNode }) {
  const { canView, isPending } = useCanView();

  if (isPending) return <AdminLoading />;
  if (!canView(code)) return <AdminAccessDenied />;
  return <>{children}</>;
}
