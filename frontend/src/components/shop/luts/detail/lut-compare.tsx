import { ChevronsLeftRight } from "lucide-react";
import { useRef, useState } from "react";
import type { LutDTO } from "@/lib/types/lut";
import { BeforeAfter } from "../before-after";

const clamp = (n: number) => Math.min(100, Math.max(0, n));

/**
 * Ảnh so sánh lớn ở trang chi tiết: kéo tay cầm (chuột / cảm ứng) hoặc dùng phím ← → để
 * xem trước / sau khi áp LUT. Tay cầm là `role="slider"` để trình đọc màn hình đọc được vị trí.
 */
export function LutCompare({ lut }: { lut: LutDTO }) {
  const [position, setPosition] = useState(55);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const moveTo = (clientX: number) => {
    const r = boxRef.current?.getBoundingClientRect();
    if (r) setPosition(clamp(((clientX - r.left) / r.width) * 100));
  };

  return (
    <div
      ref={boxRef}
      className="relative aspect-video w-full touch-pan-y overflow-hidden rounded-[12px] bg-(--sh-surface) select-none"
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        moveTo(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && moveTo(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <BeforeAfter
        beforeSrc={lut.beforeUrl ?? ""}
        afterSrc={lut.afterUrl ?? ""}
        alt={`${lut.title}: ảnh trước và sau khi áp LUT`}
        position={position}
        eager
        className="absolute inset-0"
      />

      <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
        Sau khi áp LUT
      </span>
      <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
        Ảnh gốc
      </span>

      <div
        role="slider"
        tabIndex={0}
        aria-label="Vị trí so sánh trước / sau"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${Math.round(position)}% đã áp LUT`}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 10 : 2;
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") setPosition((p) => clamp(p - step));
          else if (e.key === "ArrowRight" || e.key === "ArrowUp") setPosition((p) => clamp(p + step));
          else if (e.key === "Home") setPosition(0);
          else if (e.key === "End") setPosition(100);
          else return;
          e.preventDefault();
        }}
        className="absolute top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white text-[#151a20] shadow-lg outline-none focus-visible:ring-4 focus-visible:ring-(--sh-pink)/60"
        style={{ left: `${position}%` }}
      >
        <ChevronsLeftRight className="size-5" aria-hidden />
      </div>
    </div>
  );
}
