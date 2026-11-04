import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface ShopLogoProps {
  /** Chỉ hiện biểu tượng chữ "d" (sidebar thu gọn) */
  compact?: boolean;
  className?: string;
}

/** Logo DownBeat. Ảnh đã tối ưu nằm ở `public/brand/` (bản gốc: `public/downbeat.png`). */
export function ShopLogo({ compact = false, className }: ShopLogoProps) {
  return (
    <Link
      to="/luts"
      aria-label="DownBeat - về trang chủ"
      className={cn("inline-flex h-12 items-center rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-(--sh-pink)/60", className)}
    >
      {compact ? (
        <picture>
          <source srcSet="/brand/downbeat-mark.webp" type="image/webp" />
          <img src="/brand/downbeat-mark.png" alt="" width={40} height={40} className="size-10" />
        </picture>
      ) : (
        <picture>
          <source
            srcSet="/brand/downbeat-logo.webp 1x, /brand/downbeat-logo@2x.webp 2x"
            type="image/webp"
          />
          <img
            src="/brand/downbeat-logo.png"
            srcSet="/brand/downbeat-logo.png 1x, /brand/downbeat-logo@2x.png 2x"
            alt=""
            width={138}
            height={48}
            className="h-10 w-auto md:h-12"
          />
        </picture>
      )}
    </Link>
  );
}
