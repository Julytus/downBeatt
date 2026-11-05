import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { cn } from "@/lib/utils";
import { FeatureArt } from "./feature-art";
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

  // Mép trái băng thẻ thẳng hàng với tiêu đề (khung 1280px), còn băng thì tràn hết bề ngang
  const gutter = "max(1rem, calc((100% - 1280px) / 2))";

  return (
    <section
      aria-labelledby="features-title"
      className="relative overflow-hidden bg-(--sh-home-c) py-16 md:py-28"
    >
      <div className="mx-auto max-w-[1280px] px-4 xl:px-0">
        <h2
          id="features-title"
          className="font-display text-3xl leading-[1.1] font-bold text-(--sh-fg) md:text-5xl"
        >
          <span className="block">Công cụ mạnh mẽ, cộng đồng</span>
          <span className="block">và sự an tâm</span>
        </h2>
      </div>

      {/* Băng thẻ tràn bề ngang, 2 nút tròn viền trắng ở hai mép màn hình */}
      <div className="relative mt-12 md:mt-14">
        <ShopButton
          variant="ghost"
          size="icon"
          aria-label="Trước"
          disabled={prevDisabled}
          onClick={scrollPrev}
          className="absolute top-1/2 left-3 z-20 size-12 -translate-y-1/2 rounded-full border-[3px] border-(--sh-fg) bg-(--sh-home-c)/60 text-(--sh-fg) backdrop-blur-sm hover:bg-(--sh-home-c) disabled:opacity-30 md:left-6 md:size-16 [&_svg]:size-7 md:[&_svg]:size-9"
        >
          <ChevronLeft strokeWidth={2.25} />
        </ShopButton>

        <div
          ref={scrollerRef}
          onScroll={checkScroll}
          className="flex snap-x snap-proximity gap-6 overflow-x-auto pb-4 [scrollbar-width:none]"
          style={{ paddingInline: gutter, scrollPaddingInline: gutter }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={f.part1}
              className={cn(
                "flex w-[264px] shrink-0 flex-col overflow-hidden rounded-[12px] border border-(--sh-border) bg-gradient-to-b from-(--sh-elevated) to-(--sh-home-c) md:w-[296px]",
                i === FEATURES.length - 1 ? "snap-end" : "snap-start"
              )}
            >
              {/* Tranh minh hoạ chiếm phần trên thẻ */}
              <FeatureArt kind={f.art} />

              {/* Tiêu đề 2 phần */}
              <h3 className="mt-8 px-6 text-xl leading-snug font-bold md:px-8 md:text-2xl">
                <span className="block text-(--sh-fg)">{f.part1}</span>
                <span className={cn("block text-(--sh-accent)", f.tone)}>{f.part2}</span>
              </h3>

              {/* Đoạn mô tả */}
              <p className="mt-3 px-6 pb-10 text-base leading-relaxed text-(--sh-fg)/90 md:px-8 md:text-lg">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        <ShopButton
          variant="ghost"
          size="icon"
          aria-label="Sau"
          disabled={nextDisabled}
          onClick={scrollNext}
          className="absolute top-1/2 right-3 z-20 size-12 -translate-y-1/2 rounded-full border-[3px] border-(--sh-fg) bg-(--sh-home-c)/60 text-(--sh-fg) backdrop-blur-sm hover:bg-(--sh-home-c) disabled:opacity-30 md:right-6 md:size-16 [&_svg]:size-7 md:[&_svg]:size-9"
        >
          <ChevronRight strokeWidth={2.25} />
        </ShopButton>
      </div>
    </section>
  );
}
