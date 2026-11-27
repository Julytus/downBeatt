import { Badge } from "@/components/ui/badge";
import type { UserStatus } from "@/lib/types/user-admin";

export function UserStatusBadge({ status }: { status: UserStatus }) {
  if (status === "LOCKED") return <Badge variant="destructive">Đã khoá</Badge>;
  return (
    <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400">
      Đang hoạt động
    </Badge>
  );
}
