import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, Lock, Minus, QrCode, RefreshCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { Skeleton } from "@/components/ui/skeleton";
import { PLAN_COMPARISON } from "@/lib/mock/data/plans";
import { useShopDialog } from "@/lib/stores/shop-dialog";
import { plansQueryOptions } from "@/lib/tanstack/options/account";
import type { BillingCycle } from "@/lib/types/account";
import { cn } from "@/lib/utils";
import { PlanCard } from "./plan-card";
import { usePlanSelect } from "./use-plan-select";

const PLATFORMS = ["YouTube", "TikTok", "Facebook", "Instagram", "Zalo Video", "Website", "Podcast video", "Livestream"];

const TRUST = [
  { icon: QrCode, title: "Quét mã là xong", text: "Chuyển khoản VietQR từ mọi ngân hàng qua payOS, kích hoạt ngay." },
  { icon: RefreshCcw, title: "Huỷ bất cứ lúc nào", text: "Không ràng buộc. Gói vẫn dùng được tới hết kỳ đã trả." },
  { icon: Lock, title: "Thanh toán an toàn", text: "Giao dịch xử lý qua payOS, DownBeat không lưu thông tin tài khoản ngân hàng của bạn." }
];

const PRICING_FAQ = [
  {
    q: "Tải LUT Premium về rồi hết gói thì sao?",
    a: "Video đã xuất bản trong thời gian còn gói được dùng mãi mãi. Sau khi hết gói, bạn không tải thêm được LUT Premium mới."
  },
  {
    q: "Có được đổi gói giữa chừng không?",
    a: "Được. Nâng cấp có hiệu lực ngay, phần tiền còn lại của gói cũ được trừ vào gói mới."
  },
  {
    q: "Có xuất hoá đơn VAT không?",
    a: "Gói Studio có hoá đơn VAT điện tử gửi qua email sau mỗi kỳ thanh toán."
  }
];

export function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>("year");
  const { data: plans, isPending } = useQuery(plansQueryOptions);
  const openDialog = useShopDialog((s) => s.open);
  const { select, ctaLabel, user } = usePlanSelect(cycle);

  return (
    <div className="mx-auto max-w-[1080px]">
      <header className="text-center">
        <h1 className="font-display text-3xl font-bold tracking-[-1px] md:text-5xl">
          Gói đơn giản, đủ để bạn sáng tạo
        </h1>
        <p className="mt-3 text-(--sh-muted)">
          Mọi gói đều có <span className="font-semibold text-(--sh-accent)">giấy phép rõ ràng</span> cho video trên{" "}
          <span className="font-semibold text-(--sh-accent)">mọi nền tảng</span>.
        </p>

        <div
          role="group"
          aria-label="Chu kỳ thanh toán"
          className="mt-7 inline-flex rounded-full bg-(--sh-surface) p-1 text-sm font-semibold"
        >
          {(["month", "year"] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cycle === c}
              onClick={() => setCycle(c)}
              className={cn(
                "h-9 rounded-full px-4 transition-colors",
                cycle === c ? "bg-(--sh-elevated) shadow-sm" : "text-(--sh-muted) hover:text-(--sh-fg)"
              )}
            >
              {c === "month" ? "Theo tháng" : "Theo năm"}
              {c === "year" && <span className="ml-1.5 text-xs text-(--sh-success)">−20%</span>}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {isPending || !plans
          ? Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-[520px] rounded-[12px] bg-(--sh-surface)" />
            ))
          : plans.map((p) => (
              <PlanCard
                key={p.code}
                plan={p}
                cycle={cycle}
                current={!!user && user.plan === p.code}
                ctaLabel={ctaLabel(p)}
                onSelect={() => select(p)}
              />
            ))}
      </div>

      {!user && (
        <div className="mt-8 flex flex-col gap-3 rounded-[12px] border border-(--sh-border) p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 font-semibold">
              <Sparkles className="size-4 text-(--sh-pink)" aria-hidden /> Bắt đầu với tài khoản miễn phí
            </p>
            <p className="mt-1 text-sm text-(--sh-muted)">
              Tải không giới hạn LUT miễn phí cho video cá nhân. Nâng cấp khi bạn cần.
            </p>
          </div>
          <ShopButton variant="secondary" onClick={() => openDialog({ type: "register" })}>
            Tạo tài khoản
          </ShopButton>
        </div>
      )}

      <ul className="mt-12 grid gap-6 text-center sm:grid-cols-3">
        {TRUST.map((t) => (
          <li key={t.title}>
            <t.icon className="mx-auto size-6 text-(--sh-pink)" aria-hidden />
            <p className="mt-2 font-semibold">{t.title}</p>
            <p className="mt-1 text-sm text-(--sh-muted)">{t.text}</p>
          </li>
        ))}
      </ul>

      <section aria-labelledby="platforms-title" className="mt-14 text-center">
        <h2 id="platforms-title" className="font-semibold">
          An toàn trên <span className="text-(--sh-accent)">mọi nền tảng</span>
        </h2>
        <ul className="mt-4 flex flex-wrap justify-center gap-2">
          {PLATFORMS.map((p) => (
            <li key={p} className="rounded-full bg-(--sh-surface) px-3 py-1 text-sm font-semibold">
              {p}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="compare-title" className="mt-16">
        <h2 id="compare-title" className="font-display text-center text-2xl font-bold md:text-3xl">
          So sánh các gói
        </h2>
        {/* relative: giữ các chữ sr-only (position: absolute) trong khung cuộn, không làm tràn trang */}
        <div
          data-scroll-x
          role="region"
          aria-label="Bảng so sánh các gói (cuộn ngang trên màn hình nhỏ)"
          tabIndex={0}
          className="relative mt-6 overflow-x-auto rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-(--sh-pink)/60"
        >
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <caption className="sr-only">Bảng so sánh quyền lợi các gói</caption>
            <thead>
              <tr>
                <th scope="col" className="w-2/5 py-3 text-left font-semibold">
                  <span className="sr-only">Quyền lợi</span>
                </th>
                {(plans ?? []).map((p) => (
                  <th key={p.code} scope="col" className={cn("py-3 text-center", p.highlight && "bg-(--sh-surface)/60")}>
                    <span className="block font-semibold">{p.name}</span>
                    <span className="block text-xs font-normal text-(--sh-muted)">
                      {p.monthlyPrice === 0 ? "0đ" : `${(cycle === "year" ? p.yearlyMonthlyPrice : p.monthlyPrice).toLocaleString("vi-VN")}đ/tháng`}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            {PLAN_COMPARISON.map((group) => (
              <tbody key={group.group}>
                <tr>
                  <th scope="colgroup" colSpan={4} className="pt-6 pb-2 text-left font-semibold">
                    {group.group}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.label} className="border-t border-(--sh-border)">
                    <th scope="row" className="py-2.5 text-left font-normal text-(--sh-muted)">
                      {row.label}
                    </th>
                    {row.values.map((v, i) => (
                      <td key={i} className={cn("py-2.5 text-center", plans?.[i]?.highlight && "bg-(--sh-surface)/60")}>
                        {v === true ? (
                          <>
                            <Check className="mx-auto size-4 text-(--sh-success)" aria-hidden />
                            <span className="sr-only">Có</span>
                          </>
                        ) : v === false ? (
                          <>
                            <Minus className="mx-auto size-4 text-(--sh-muted)" aria-hidden />
                            <span className="sr-only">Không</span>
                          </>
                        ) : (
                          v
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </section>

      <section aria-labelledby="pricing-faq-title" className="mt-16">
        <h2 id="pricing-faq-title" className="text-lg font-bold">
          Câu hỏi về thanh toán
        </h2>
        <div className="mt-4 divide-y divide-(--sh-border) border-y border-(--sh-border)">
          {PRICING_FAQ.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="pb-4 text-sm leading-6 text-(--sh-muted)">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-10 flex flex-col gap-3 rounded-[12px] bg-(--sh-surface) p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Cần giấy phép lớn hơn?</p>
          <p className="mt-1 text-sm text-(--sh-muted)">
            Đài truyền hình, rạp chiếu, chiến dịch quảng cáo lớn: liên hệ để có báo giá riêng.
          </p>
        </div>
        <ShopButton asChild variant="outline">
          <a href="mailto:hotro@downbeat.local">Liên hệ với chúng tôi</a>
        </ShopButton>
      </div>

      <p className="mt-8 text-center text-sm text-(--sh-muted)">
        Chưa chắc chắn?{" "}
        <Link to="/luts" className="font-semibold text-(--sh-fg) underline underline-offset-4">
          Xem thử kho LUT
        </Link>
      </p>
    </div>
  );
}
