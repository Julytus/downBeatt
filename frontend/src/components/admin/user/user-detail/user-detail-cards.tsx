import { Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserAdminDetail } from "@/lib/types/user-admin";
import { formatVnd } from "@/lib/utils/money";
import { cycleLabel, formatOrderDateTime, formatPlanDate, orderStatusLabel } from "@/lib/utils/plan";
import { planCodeLabel } from "@/lib/utils/user-admin";

/** Card là vùng (`role="region"`) có `aria-label` bằng tiêu đề (plan §6.3), để đọc màn hình và E2E tìm theo vùng. */
function SectionCard({
  title,
  className,
  children
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card role="region" aria-label={title} className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function UserStatCards({ stats }: { stats: UserAdminDetail["stats"] }) {
  const items = [
    { title: "Đơn đã thanh toán", value: String(stats.paidOrders) },
    { title: "Tổng đã chi", value: formatVnd(stats.totalPaid) },
    { title: "Lượt tải", value: String(stats.downloads) },
    { title: "Bộ sưu tập", value: String(stats.collections) }
  ];
  return (
    <div className="grid grid-cols-2 gap-4 lg:col-span-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card role="region" aria-label={item.title} key={item.title} className="gap-2 py-5">
          <CardHeader className="px-5">
            <p className="text-muted-foreground text-sm font-medium">{item.title}</p>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-2xl font-semibold tabular-nums">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function UserInfoCard({ user }: { user: UserAdminDetail }) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Email", value: <span className="break-all">{user.email}</span> },
    { label: "Số điện thoại", value: user.phone || "—" },
    {
      label: "Chức vụ",
      value: (
        <span className="inline-flex flex-wrap items-center gap-2">
          {user.roleName}
          {user.isOperator === 1 && <Badge variant="outline">Toàn quyền</Badge>}
        </span>
      )
    },
    { label: "Ngày đăng ký", value: formatOrderDateTime(user.regisDate) || "—" }
  ];
  return (
    <SectionCard title="Thông tin">
      <dl className="grid gap-3 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="grid gap-0.5">
            <dt className="text-muted-foreground">{r.label}</dt>
            <dd className="font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  );
}

export function UserPlanCard({ subscription }: { subscription: UserAdminDetail["subscription"] }) {
  const paid = subscription.planCode !== "free";
  return (
    <SectionCard title="Gói hiện tại">
      <p className="text-xl font-semibold">Gói {subscription.planName}</p>
      {paid ? (
        <ul className="text-muted-foreground mt-3 grid gap-1 text-sm">
          <li>Chu kỳ: {cycleLabel(subscription.cycle)}</li>
          <li>Bắt đầu: {formatPlanDate(subscription.startDate)}</li>
          <li>Hết hạn: {formatPlanDate(subscription.endDate)}</li>
          <li>Tự gia hạn: {subscription.autoRenew === 0 ? "Đã huỷ" : "Bật"}</li>
        </ul>
      ) : (
        <p className="text-muted-foreground mt-2 text-sm">Chưa có gói trả phí còn hạn.</p>
      )}
    </SectionCard>
  );
}

export function UserPreferenceCard({ preferences }: { preferences: string[] }) {
  return (
    <SectionCard title="Sở thích màu">
      {preferences.length === 0 ? (
        <p className="text-muted-foreground text-sm">Chưa khai báo.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {preferences.map((p) => (
            <Badge key={p} variant="secondary">
              {p}
            </Badge>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function UserOrdersCard({ orders }: { orders: UserAdminDetail["recentOrders"] }) {
  return (
    <SectionCard title="Đơn hàng gần đây" className="lg:col-span-2">
      {orders.length === 0 ? (
        <p className="text-muted-foreground text-sm">Chưa có đơn hàng.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table aria-label="Đơn hàng gần đây">
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Gói</TableHead>
                  <TableHead>Chu kỳ</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.code}>
                    <TableCell className="font-mono text-xs">{o.code}</TableCell>
                    <TableCell>{o.planName}</TableCell>
                    <TableCell>{cycleLabel(o.cycle)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVnd(o.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={o.status === "PAID" ? "default" : "secondary"}>{orderStatusLabel(o.status)}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatOrderDateTime(o.createdTime)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {orders.length >= 10 && <p className="text-muted-foreground mt-3 text-sm">Hiện 10 đơn mới nhất.</p>}
        </>
      )}
    </SectionCard>
  );
}

export function UserDownloadsCard({
  downloads,
  canViewLut
}: {
  downloads: UserAdminDetail["recentDownloads"];
  canViewLut: boolean;
}) {
  return (
    <SectionCard title="Lượt tải gần đây">
      {downloads.length === 0 ? (
        <p className="text-muted-foreground text-sm">Chưa tải LUT nào.</p>
      ) : (
        <ul className="grid gap-3">
          {downloads.map((d, i) => (
            <li key={`${d.lutId}-${d.createdTime}-${i}`} className="flex items-center gap-3">
              {d.coverUrl ? (
                <img
                  src={d.coverUrl}
                  alt=""
                  loading="lazy"
                  className="bg-muted size-10 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="bg-muted size-10 shrink-0 rounded-md" aria-hidden />
              )}
              <div className="min-w-0">
                {canViewLut ? (
                  <Link
                    to="/admin/luts/$id"
                    params={{ id: String(d.lutId) }}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {d.lutTitle ?? `LUT #${d.lutId}`}
                  </Link>
                ) : (
                  <span className="block truncate text-sm font-medium">{d.lutTitle ?? `LUT #${d.lutId}`}</span>
                )}
                <span className="text-muted-foreground block text-xs">
                  {formatOrderDateTime(d.createdTime)} · Gói {planCodeLabel(d.planCode)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
