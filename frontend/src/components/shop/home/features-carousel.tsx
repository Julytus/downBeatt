import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { cn } from "@/lib/utils";
import { FeatureArt } from "./feature-art";
import { FEATURES } from "./home-data";

/** Tốc độ tự trôi (px/giây). */
const AUTO_SPEED = 40;

/**
 * Băng thẻ chạy vô hạn: render 3 bộ thẻ [bản sao | thật | bản sao] trên một "track" dịch bằng transform.
 * Vị trí `offset` luôn được quấn về [0, setWidth), nên khi trôi hết một bộ thì nhảy lùi đúng một bộ — mắt không thấy chỗ nối.
 * - Tự trôi; dừng khi rê chuột / focus / đang kéo / tab bị ẩn; tắt hẳn khi bật giảm chuyển động.
 * - Nút Trước/Sau đẩy thêm một bước bằng đúng một thẻ (có easing), không bao giờ bị tắt.
 * - Kéo bằng chuột / tay để cuộn.
 * Bộ bản sao gắn aria-hidden + inert nên trình đọc màn hình / bàn phím chỉ thấy 8 thẻ thật.
 */
function useInfiniteTrack() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const realFirstRef = useRef<HTMLDivElement>(null);
  const cloneFirstRef = useRef<HTMLDivElement>(null);

  // Trạng thái chạy nằm trong ref để không render lại React mỗi khung hình
  const state = useRef({ offset: 0, pending: 0, setWidth: 0, hover: false, focus: false, drag: false, lastX: 0 });

  useEffect(() => {
    const track = trackRef.current;
    const realFirst = realFirstRef.current;
    const cloneFirst = cloneFirstRef.current;
    if (!track || !realFirst || !cloneFirst) return;

    const s = state.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const measure = () => {
      s.setWidth = cloneFirst.offsetLeft - realFirst.offsetLeft;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const W = s.setWidth;
      if (W > 0) {
        const paused = s.hover || s.focus || s.drag || document.hidden || reduced.matches;
        // Bước của nút bấm: tiến dần về đích theo hàm mũ
        const step = s.pending * (1 - Math.exp(-dt * 9));
        s.pending -= step;
        if (Math.abs(s.pending) < 0.5) s.pending = 0;
        s.offset += step + (paused ? 0 : AUTO_SPEED * dt);
        s.offset = ((s.offset % W) + W) % W;
        // Bắt đầu từ bộ thật (lùi qua bộ bản sao đầu tiên)
        track.style.transform = `translate3d(${-(W + s.offset)}px,0,0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  /** Đẩy một bước = một thẻ (setWidth / số thẻ). */
  const nudge = (dir: 1 | -1) => {
    const s = state.current;
    s.pending += (dir * s.setWidth) / FEATURES.length;
  };

  const viewportHandlers = {
    onPointerEnter: () => (state.current.hover = true),
    onPointerLeave: () => (state.current.hover = false),
    onFocus: () => (state.current.focus = true),
    onBlur: () => (state.current.focus = false),
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      const s = state.current;
      s.drag = true;
      s.pending = 0;
      s.lastX = e.clientX;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      const s = state.current;
      if (!s.drag) return;
      s.offset -= e.clientX - s.lastX;
      s.lastX = e.clientX;
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      state.current.drag = false;
      // Chuột: rời khỏi băng sau khi thả thì tiếp tục chạy; cảm ứng không có hover
      if (e.pointerType !== "mouse") state.current.hover = false;
    },
    onPointerCancel: () => {
      state.current.drag = false;
      state.current.hover = false;
    }
  };

  return { viewportRef, trackRef, realFirstRef, cloneFirstRef, nudge, viewportHandlers };
}

export function FeaturesCarousel() {
  const { viewportRef, trackRef, realFirstRef, cloneFirstRef, nudge, viewportHandlers } = useInfiniteTrack();

  // Mép trái băng thẻ thẳng hàng với tiêu đề (khung 1280px), còn băng thì tràn hết bề ngang
  const gutter = "max(1rem, calc((100% - 1280px) / 2))";

  const renderSet = (copy: "before" | "real" | "after") => {
    const isClone = copy !== "real";
    return FEATURES.map((f, i) => (
      <div
        key={`${copy}-${f.part1}`}
        ref={i === 0 ? (copy === "real" ? realFirstRef : copy === "after" ? cloneFirstRef : undefined) : undefined}
        aria-hidden={isClone || undefined}
        inert={isClone || undefined}
        className="flex w-[264px] shrink-0 flex-col overflow-hidden rounded-[12px] border border-(--sh-border) bg-gradient-to-b from-(--sh-elevated) to-(--sh-home-c) select-none md:w-[296px]"
      >
        {/* Tranh minh hoạ chiếm phần trên thẻ */}
        <FeatureArt kind={f.art} />

        {/* Tiêu đề 2 phần */}
        <h3 className="mt-8 px-6 text-xl leading-snug font-bold md:px-8 md:text-2xl">
          <span className="block text-(--sh-fg)">{f.part1}</span>
          <span className={cn("block text-(--sh-accent)", f.tone)}>{f.part2}</span>
        </h3>

        {/* Đoạn mô tả */}
        <p className="mt-3 px-6 pb-10 text-base leading-relaxed text-(--sh-fg)/90 md:px-8 md:text-lg">{f.desc}</p>
      </div>
    ));
  };

  return (
    <section aria-labelledby="features-title" className="relative overflow-hidden bg-(--sh-home-c) py-16 md:py-28">
      <div className="mx-auto max-w-[1280px] px-4 xl:px-0">
        <h2 id="features-title" className="font-display text-3xl leading-[1.1] font-bold text-(--sh-fg) md:text-5xl">
          <span className="block">Công cụ mạnh mẽ, cộng đồng</span>
          <span className="block">và sự an tâm</span>
        </h2>
      </div>

      {/* Băng thẻ tràn bề ngang, chạy vô hạn; 2 nút tròn viền trắng ở hai mép màn hình */}
      <div className="relative mt-12 md:mt-14">
        <ShopButton
          variant="ghost"
          size="icon"
          aria-label="Trước"
          onClick={() => nudge(-1)}
          className="absolute top-1/2 left-3 z-20 size-12 -translate-y-1/2 rounded-full border-[3px] border-(--sh-fg) bg-(--sh-home-c)/60 text-(--sh-fg) backdrop-blur-sm hover:bg-(--sh-home-c) md:left-6 md:size-16 [&_svg]:size-7 md:[&_svg]:size-9"
        >
          <ChevronLeft strokeWidth={2.25} />
        </ShopButton>

        <div
          ref={viewportRef}
          {...viewportHandlers}
          className="cursor-grab touch-pan-y overflow-hidden pb-4 active:cursor-grabbing"
          style={{ paddingInline: gutter }}
        >
          <div ref={trackRef} className="flex w-max gap-6 will-change-transform">
            {renderSet("before")}
            {renderSet("real")}
            {renderSet("after")}
          </div>
        </div>

        <ShopButton
          variant="ghost"
          size="icon"
          aria-label="Sau"
          onClick={() => nudge(1)}
          className="absolute top-1/2 right-3 z-20 size-12 -translate-y-1/2 rounded-full border-[3px] border-(--sh-fg) bg-(--sh-home-c)/60 text-(--sh-fg) backdrop-blur-sm hover:bg-(--sh-home-c) md:right-6 md:size-16 [&_svg]:size-7 md:[&_svg]:size-9"
        >
          <ChevronRight strokeWidth={2.25} />
        </ShopButton>
      </div>
    </section>
  );
}
