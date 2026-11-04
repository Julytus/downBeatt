import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { meQueryOptions } from "@/lib/tanstack/options/auth";

export const Route = createFileRoute("/admin/")({
  component: AdminHomePage
});

function AdminHomePage() {
  const { data: me } = useQuery(meQueryOptions);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Xin chào, {me?.name ?? "bạn"}</h1>
        <p className="text-muted-foreground">Chọn chức năng ở thanh bên để bắt đầu.</p>
      </div>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Tài khoản</CardTitle>
          <CardDescription>Thông tin đăng nhập hiện tại</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Email: {me?.email ?? "—"}</p>
          <p>Chức vụ: {me?.roleName ?? "—"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
