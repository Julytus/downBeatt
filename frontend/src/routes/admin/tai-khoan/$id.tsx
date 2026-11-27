import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ArrowLeft, UserX } from "lucide-react";

import { AdminLoadError } from "@/components/admin/admin-load-error";
import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import {
  UserDownloadsCard,
  UserInfoCard,
  UserOrdersCard,
  UserPlanCard,
  UserPreferenceCard,
  UserStatCards
} from "@/components/admin/user/user-detail/user-detail-cards";
import { UserStatusBadge } from "@/components/admin/user/user-status-badge";
import { useUserActions } from "@/components/admin/user/use-user-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCanView } from "@/hooks/use-can-view";
import { meQueryOptions } from "@/lib/tanstack/options/auth";
import { createUserDetailQueryOptions } from "@/lib/tanstack/options/user-admin";
import { canManageUser } from "@/lib/utils/user-admin";

const RESOURCE_CODE = "USER";

export const Route = createFileRoute("/admin/tai-khoan/$id")({
  component: UserDetailRoute
});

function UserDetailRoute() {
  return (
    <AdminPermissionGuard code={RESOURCE_CODE}>
      <UserDetailPage />
    </AdminPermissionGuard>
  );
}

function BackButton() {
  const navigate = useNavigate();
  return (
    <Button variant="ghost" className="w-fit" onClick={() => void navigate({ to: "/admin/tai-khoan" })}>
      <ArrowLeft />
      Quay lại danh sách
    </Button>
  );
}

function UserDetailPage() {
  const { id: rawId } = Route.useParams();
  const id = Number(rawId);
  const isValidId = Number.isInteger(id) && id > 0;

  const { can } = useCanView();
  const canUpdate = can(RESOURCE_CODE, "UPDATE");
  const canViewLut = can("LUT", "VIEW");
  const { data: me } = useQuery(meQueryOptions);
  const { onLock, onUnlock, onChangeRole, dialogs } = useUserActions({ meIsOperator: me?.isOperator === 1 });

  const { data: user, isPending, isError, error, refetch, isFetching } = useQuery({
    ...createUserDetailQueryOptions(id),
    enabled: isValidId
  });

  const notFound =
    !isValidId || (isError && error instanceof AxiosError && error.response?.status === 404);

  if (notFound) {
    return (
      <div className="container mx-auto flex flex-col gap-6 p-6">
        <Card className="mx-auto mt-10 w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
              <UserX className="size-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Không tìm thấy tài khoản</h2>
              <p className="text-muted-foreground text-sm">Tài khoản này không tồn tại hoặc đã bị xoá.</p>
            </div>
            <BackButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) return <AdminLoadError onRetry={() => void refetch()} retrying={isFetching} />;

  if (isPending || !user) {
    return (
      <div className="container mx-auto flex flex-col gap-6 p-6" aria-busy="true">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const canManage = canUpdate && canManageUser(me, user);

  return (
    <div className="container mx-auto flex flex-col gap-6 p-6">
      <BackButton />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
          <UserStatusBadge status={user.status} />
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => onChangeRole(user)}>
              Đổi chức vụ
            </Button>
            {user.status === "ACTIVE" ? (
              <Button variant="destructive" onClick={() => onLock(user)}>
                Khoá tài khoản
              </Button>
            ) : (
              <Button variant="outline" onClick={() => onUnlock(user)}>
                Mở khoá
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <UserStatCards stats={user.stats} />
        <UserInfoCard user={user} />
        <UserPlanCard subscription={user.subscription} />
        <UserPreferenceCard preferences={user.preferences} />
        <UserOrdersCard orders={user.recentOrders} />
        <UserDownloadsCard downloads={user.recentDownloads} canViewLut={canViewLut} />
      </div>

      {dialogs}
    </div>
  );
}
