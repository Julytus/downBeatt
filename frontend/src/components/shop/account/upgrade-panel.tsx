import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { MOCK_PLANS } from "@/lib/mock/data/plans";
import { formatVnd } from "@/lib/utils/money";

const PRO = MOCK_PLANS.find((p) => p.code === "pro")!;

/** Nội dung hộp thoại khi tài khoản Miễn phí bấm tải LUT Premium */
export function UpgradePanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2 text-sm">
        {PRO.features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-(--sh-success)" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      <p className="text-sm text-(--sh-muted)">
        Gói Pro chỉ từ <b className="text-(--sh-fg)">{formatVnd(PRO.yearlyMonthlyPrice)}/tháng</b> khi trả theo năm.
        Huỷ bất cứ lúc nào.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <ShopButton asChild variant="primary" className="sm:flex-1">
          <Link to="/pricing" onClick={onClose}>
            Xem bảng giá
          </Link>
        </ShopButton>
        <ShopButton variant="secondary" onClick={onClose} className="sm:flex-1">
          Để sau
        </ShopButton>
      </div>
    </div>
  );
}
