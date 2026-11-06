import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Vị trí đường chia trước/sau theo chuột. Gắn `bind` vào phần tử ngoài cùng nhận chuột
 * (thẻ hoặc hero) – không gắn vào ảnh, vì link/nội dung đặt đè lên sẽ chặn sự kiện.
 */
export function useSplitPosition(rest = 72) {
  const [position, setPosition] = useState(rest);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    setPosition(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
  }, []);
  const onPointerLeave = useCallback(() => setPosition(rest), [rest]);

  return { position, bind: { onPointerMove, onPointerLeave } };
}

interface BeforeAfterProps {
  beforeSrc: string;
  afterSrc: string;
  alt: string;
  /** Vị trí đường chia (% từ trái), thường lấy từ useSplitPosition */
  position: number;
  /** Ảnh nằm trên màn hình đầu tiên thì tải ngay */
  eager?: boolean;
  className?: string;
  children?: React.ReactNode;
  /** Filter tùy chọn nếu dùng cho ảnh tĩnh không có bản sau riêng như hero */
  grade?: string;
}

/** Ảnh so sánh: trái đường chia = đã áp LUT, phải = ảnh gốc. */
export function BeforeAfter({
  beforeSrc,
  afterSrc,
  alt,
  position,
  eager = false,
  className,
  children,
  grade
}: BeforeAfterProps) {
  const loading = eager ? "eager" : "lazy";

  return (
    <div className={cn("relative overflow-hidden select-none", className)}>
      <img
        src={beforeSrc}
        alt=""
        aria-hidden
        loading={loading}
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <img
        src={afterSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        draggable={false}
        data-graded
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: grade, clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />
      {position < 100 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-[#f7789f]/80"
          style={{ left: `${position}%` }}
        />
      )}
      {children}
    </div>
  );
}
