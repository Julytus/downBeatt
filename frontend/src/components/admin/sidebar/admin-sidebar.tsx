"use client";

import * as React from "react";
import { Command, House } from "lucide-react";
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

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { canView } = useCanView();

  const navMain: AdminNavItem[] = [
    { title: "Trang chủ", url: "/admin", icon: House },
    ...FEATURE_ITEMS.filter((i) => canView(i.code))
  ];

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
      </SidebarContent>
    </Sidebar>
  );
}
