import { createFileRoute, redirect } from "@tanstack/react-router";

import { AdminLayout } from "@/components/admin/admin-layout";
import { useAuthStore } from "@/lib/stores/auth";

/** Layout chính của ứng dụng: các trang quản trị là route con của /admin và yêu cầu đăng nhập. */
export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (!useAuthStore.getState().accessToken) {
      throw redirect({ to: "/login" });
    }
  },
  component: AdminLayout
});
