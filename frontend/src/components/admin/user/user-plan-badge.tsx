import { Badge } from "@/components/ui/badge";
import { formatPlanDate } from "@/lib/utils/plan";
import type { UserAdminItem } from "@/lib/types/user-admin";

export function UserPlanBadge({ user }: { user: Pick<UserAdminItem, "planCode" | "planName" | "planExpiresAt"> }) {
  const paid = user.planCode !== "free";
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant={paid ? "default" : "secondary"}>{user.planName}</Badge>
      {paid && user.planExpiresAt && (
        <span className="text-muted-foreground text-xs">Hết hạn {formatPlanDate(user.planExpiresAt)}</span>
      )}
    </div>
  );
}
