import { Link } from "@tanstack/react-router";
import { BadgeCheck, Palette, Sparkles } from "lucide-react";
import { ShopLogo } from "@/components/shop/layout/shop-logo";
import { SOCIAL_LINKS } from "@/components/shop/ui/brand-icons";
import { ShopButton } from "@/components/shop/ui/shop-button";

const VALUE_PROPS = [
  {
    icon: Palette,
    title: "Chỉnh màu chuẩn, dùng ngay",
    text: "Mỗi LUT được thử trên nhiều loại cảnh quay. Kéo thả file .cube là có màu đẹp, không cần cài thêm gì."
  },
  {
    icon: Sparkles,
    title: "Bắt kịp xu hướng",
    text: "LUT mới mỗi tuần theo trào lưu màu trên mạng xã hội và điện ảnh, để video của bạn luôn mới."
  },
  {
    icon: BadgeCheck,
    title: "Yên tâm bản quyền",
    text: "Mọi LUT đều có giấy phép rõ ràng cho từng gói. Đăng video ở bất kỳ đâu mà không lo bị khiếu nại."
  }
];

type FooterLink = { label: string } & ({ to: "/luts" | "/pricing" } | { category: string } | { href: string });

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Sản phẩm",
    links: [
      { label: "Kho LUT", to: "/luts" },
      { label: "Bảng giá", to: "/pricing" },
      { label: "LUT cho DaVinci Resolve", category: "davinci-resolve" },
      { label: "LUT cho Premiere Pro", category: "premiere-pro" }
    ]
  },
  {
    title: "Khám phá",
    links: [
      { label: "LUT điện ảnh", category: "dien-anh" },
      { label: "LUT phim nhựa", category: "phim-nhua" },
      { label: "LUT đám cưới", category: "dam-cuoi" },
      { label: "LUT du lịch", category: "du-lich" }
    ]
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Trung tâm trợ giúp", href: "#" },
      { label: "Liên hệ", href: "mailto:hotro@downbeat.local" },
      { label: "Blog", href: "#" }
    ]
  }
];

/** min-h-6: vùng bấm tối thiểu 24px (WCAG 2.5.8) cho link chữ */
const linkClass = "inline-flex min-h-6 items-center text-sm text-(--sh-muted) transition-colors hover:text-(--sh-fg)";

function FooterLinkItem({ link }: { link: FooterLink }) {
  if ("to" in link)
    return (
      <Link to={link.to} className={linkClass}>
        {link.label}
      </Link>
    );
  if ("category" in link)
    return (
      <Link to="/luts/danh-muc/$category" params={{ category: link.category }} className={linkClass}>
        {link.label}
      </Link>
    );
  return (
    <a href={link.href} className={linkClass}>
      {link.label}
    </a>
  );
}

export function ShopFooter() {
  return (
    <footer className="px-4 pb-8 md:px-12">
      <ul className="grid gap-3 md:grid-cols-3">
        {VALUE_PROPS.map((v) => (
          <li key={v.title} className="rounded-[12px] border border-(--sh-border) p-5">
            <v.icon className="size-5 text-(--sh-pink)" aria-hidden />
            <h2 className="mt-3 font-semibold">{v.title}</h2>
            <p className="mt-1 text-sm leading-6 text-(--sh-muted)">{v.text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col gap-2 border-t border-(--sh-border) pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-(--sh-muted)">
          Được hơn <b className="text-(--sh-fg)">120.000</b> nhà sáng tạo nội dung tin dùng
        </p>
        <p className="font-display text-xl font-bold">
          Tự do <span className="text-(--sh-accent)">sáng tạo</span>
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_2fr]">
        <div className="max-w-sm">
          <ShopLogo />
          <p className="mt-3 text-sm leading-6 text-(--sh-muted)">
            DownBeat là kho LUT và preset chỉnh màu cho nhà sáng tạo Việt: tải miễn phí, nâng cấp khi cần
            dùng cho khách hàng.
          </p>
        </div>
        <nav aria-label="Liên kết cuối trang" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-sm font-semibold">{col.title}</h2>
              <ul className="mt-3 flex flex-col gap-1">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <FooterLinkItem link={l} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-10 flex flex-col-reverse gap-4 border-t border-(--sh-border) pt-6 text-sm text-(--sh-muted) md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a href="#" className="inline-flex min-h-6 items-center hover:text-(--sh-fg)">
            Điều khoản sử dụng
          </a>
          <a href="#" className="inline-flex min-h-6 items-center hover:text-(--sh-fg)">
            Chính sách bảo mật
          </a>
          <span>© 2026 DownBeat. Đồ án thương mại điện tử.</span>
        </div>
        <div className="flex gap-1">
          {SOCIAL_LINKS.map((s) => (
            <ShopButton key={s.label} asChild variant="ghost" size="icon">
              <a href={s.href} aria-label={s.label}>
                <s.icon className="size-4!" />
              </a>
            </ShopButton>
          ))}
        </div>
      </div>
    </footer>
  );
}
