import { Navigate, Outlet } from "@tanstack/react-router";

import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar/admin-sidebar";
import { AdminUser } from "@/components/admin/sidebar/admin-user";
import { useQuery } from "@tanstack/react-query";
import { meQueryOptions } from "@/lib/tanstack/options/auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminLoadError } from "@/components/admin/admin-load-error";
import { AdminLoading } from "@/components/admin/admin-loading";
import { ThemeToggle } from "@/components/layout/theme/theme-toggle";
import { useAuthStore } from "@/lib/stores/auth";

/** Khung giao diện dùng chung (sidebar + header + canvas bo góc) cho nhóm route /admin. */
export function AdminLayout() {
  const { data: me, isLoading, isError, isFetching, refetch } = useQuery(meQueryOptions);
  // Token bị xoá khi đang ở trong trang quản trị (hết phiên, đăng xuất ở tab khác) => về trang đăng nhập
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!accessToken) {
    return <Navigate to="/login" />;
  }

  if (isLoading) {
    return <AdminLoading />;
  }

  // Lỗi 401 đã được axios xử lý (refresh / về /login); còn lại (5xx, mất mạng) thì báo lỗi, không treo
  if (isError) {
    return <AdminLoadError onRetry={() => void refetch()} retrying={isFetching} />;
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <ThemeToggle />
            <AdminUser
              user={{
                name: me?.name ?? "—",
                email: me?.email ?? "—",
                avatar: me?.avatar,
                roleName: me?.roleName ?? "—"
              }}
            />
          </div>
        </header>
        {/* Main Content Area with rounded canvas effect */}
        <main className="flex-1 overflow-hidden px-4 pb-4">
          <div className="bg-background h-full w-full overflow-hidden rounded-3xl border shadow-sm">
            <ScrollArea className="h-full w-full [&_[data-slot=scroll-area-viewport]>div]:!block">
              <div className="p-6 md:p-8">
                <Outlet />
              </div>
            </ScrollArea>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
