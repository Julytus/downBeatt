import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Command } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme/theme-toggle";
import { useAuthStore } from "@/lib/stores/auth";

/** Layout cho các trang chưa đăng nhập (login). Đã có token thì vào thẳng trang quản trị. */
export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ location }) => {
    if (location.pathname !== "/logout" && useAuthStore.getState().accessToken) {
      throw redirect({ to: "/admin" });
    }
  },
  component: AuthLayout
});

function AuthLayout() {
  return (
    <div className="bg-muted/40 flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2 font-semibold">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <Command className="size-4" />
          </div>
          DownBeat
        </div>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="bg-background w-full max-w-5xl rounded-3xl border p-8 shadow-sm md:p-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
