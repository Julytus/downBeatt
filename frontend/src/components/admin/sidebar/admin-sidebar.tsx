import * as React from "react";
import { Boxes, Command, House, KeyRound, LayoutGrid, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { AdminMain, type AdminNavItem } from "@/components/admin/sidebar/admin-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import { useCanView } from "@/hooks/use-can-view";

/**
 * Mục menu theo quyền: `code` khớp cột `resource.code` trong DB, chỉ hiện khi role có quyền VIEW.
 * Chức năng mới: thêm `{ code, title, url, icon }` vào đây (hoặc `items` để gom nhóm).
 * Backend vẫn chặn ở API nên đây chỉ là ẩn/hiện UI, không phải lớp bảo vệ.
 */
const FEATURE_ITEMS: (AdminNavItem & { code: string })[] = [];

/** Nhóm "Hệ thống": các trang phân quyền (resource MODULE / RESOURCE / ROLE / PERMISSION, migration V4). */
const SYSTEM_ITEMS: (AdminNavItem & { code: string })[] = [
  { code: "ROLE", title: "Chức vụ", url: "/admin/chuc-vu", icon: ShieldCheck },
  { code: "PERMISSION", title: "Phân quyền", url: "/admin/phan-quyen", icon: KeyRound },
  { code: "RESOURCE", title: "Tài nguyên", url: "/admin/tai-nguyen", icon: Boxes },
  { code: "MODULE", title: "Module", url: "/admin/module", icon: LayoutGrid }
];

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { canView } = useCanView();

  const navMain: AdminNavItem[] = [
    { title: "Trang chủ", url: "/admin", icon: House },
    ...FEATURE_ITEMS.filter((i) => canView(i.code))
  ];
  const navSystem = SYSTEM_ITEMS.filter((i) => canView(i.code));

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/admin">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-lg leading-tight">
                  <span className="font-semibold">DownBeat</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <AdminMain label="Chức năng chính" items={navMain} />
        {navSystem.length > 0 && <AdminMain label="Hệ thống" items={navSystem} />}
      </SidebarContent>
    </Sidebar>
  );
}
