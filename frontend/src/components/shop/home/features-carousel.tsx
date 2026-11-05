import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { cn } from "@/lib/utils";
import { FEATURES } from "./home-data";

export function FeaturesCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [prevDisabled, setPrevDisabled] = useState(true);
  const [nextDisabled, setNextDisabled] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setPrevDisabled(el.scrollLeft <= 5);
    setNextDisabled(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  const scrollNext = () => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: Math.max(el.clientWidth * 0.8, 260), behavior: "smooth" });
  };

  const scrollPrev = () => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: -Math.max(el.clientWidth * 0.8, 260), behavior: "smooth" });
  };

  return (
    <section
      aria-labelledby="features-title"
      className="relative overflow-hidden px-4 py-16 md:px-8 md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="features-title"
          className="font-display text-center text-2xl font-bold tracking-tight text-(--sh-fg) md:text-4xl"
        >
          <span className="block">Công cụ mạnh mẽ, cộng đồng</span>
          <span className="block text-(--sh-accent)">và sự an tâm</span>
        </h2>

        {/* Khung băng thẻ kèm 2 nút chồng mép trái / phải */}
        <div className="relative mt-12">
          {/* Nút Trước chồng mép trái */}
          <ShopButton
            variant="secondary"
            size="icon"
            aria-label="Trước"
            disabled={prevDisabled}
            onClick={scrollPrev}
            className="absolute -left-2 top-1/2 z-20 size-10 -translate-y-1/2 rounded-full border border-(--sh-border) bg-(--sh-elevated) shadow-md hover:bg-(--sh-surface) md:-left-4"
          >
            <ChevronLeft className="size-5" />
          </ShopButton>

          {/* Băng thẻ cuộn ngang */}
          <div
            ref={scrollerRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto px-1 pb-4 snap-x snap-proximity [scrollbar-width:none]"
          >
            {FEATURES.map((f, i) => (
              <div
                key={f.part1}
                className={cn(
                  "w-[240px] shrink-0 rounded-[16px] border border-(--sh-border) bg-(--sh-elevated) p-4 shadow-sm md:w-[220px]",
                  i === FEATURES.length - 1 ? "snap-end" : "snap-start"
                )}
              >
                {/* Vùng minh hoạ 4:3 */}
                <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-[10px] bg-(--sh-surface) p-4">
                  <f.icon className="size-10 text-(--sh-primary)" aria-hidden="true" />
                  <div className="mt-3 flex w-3/4 flex-col gap-1.5 opacity-40">
                    <div className="h-1.5 w-full rounded bg-(--sh-fg)" />
                    <div className="h-1.5 w-2/3 rounded bg-(--sh-fg)" />
                  </div>
                </div>

                {/* Tiêu đề 2 phần */}
                <h3 className="mt-4 font-display text-base font-bold">
                  <span className="text-(--sh-fg)">{f.part1} </span>
                  <span className="text-(--sh-accent)">{f.part2}</span>
                </h3>

                {/* Đoạn mô tả */}
                <p className="mt-1.5 text-xs leading-relaxed text-(--sh-muted)">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Nút Sau chồng mép phải */}
          <ShopButton
            variant="secondary"
            size="icon"
            aria-label="Sau"
            disabled={nextDisabled}
            onClick={scrollNext}
            className="absolute -right-2 top-1/2 z-20 size-10 -translate-y-1/2 rounded-full border border-(--sh-border) bg-(--sh-elevated) shadow-md hover:bg-(--sh-surface) md:-right-4"
          >
            <ChevronRight className="size-5" />
          </ShopButton>
        </div>
      </div>
    </section>
  );
}
