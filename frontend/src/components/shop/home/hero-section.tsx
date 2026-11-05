import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { cn } from "@/lib/utils";
import { HERO_CATEGORIES, HERO_COMMITMENTS, picsumId } from "./home-data";

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-x-clip bg-(--sh-home-a) px-4 pt-14 pb-24 md:px-8 md:pt-20 md:pb-32"
    >
      {/* Dải lụa: trên phải nằm sau header trong suốt; dưới trái tràn xuống khối kế tiếp */}
      <img
        src="/hero-wave-upper.webp"
        alt=""
        aria-hidden="true"
        width={640}
        height={521}
        className="pointer-events-none absolute -top-[72px] right-0 w-[min(529px,34vw)] select-none"
      />
      <img
        src="/hero-wave-lower.webp"
        alt=""
        aria-hidden="true"
        width={640}
        height={909}
        className="pointer-events-none absolute bottom-0 left-0 w-[min(560px,40vw)] translate-y-[44%] select-none [mask-image:linear-gradient(to_bottom,black_55%,transparent_88%)]"
      />

      <div className="relative mx-auto max-w-[1424px]">
        <h1
          id="hero-title"
          className="font-display text-center text-4xl font-bold tracking-tight text-(--sh-fg) md:text-6xl xl:text-[76px] xl:leading-[1.1]"
        >
          Màu điện ảnh cho mọi khung hình
        </h1>
        <p className="mx-auto mt-5 max-w-4xl text-center text-base text-(--sh-fg)/90 md:text-[22px]">
          LUT chỉnh màu do colorist thật tạo ra, dùng được với mọi phần mềm dựng phim.
        </p>

        {/* 5 ô danh mục */}
        <div className="mt-12 grid grid-cols-2 gap-4 md:mt-20 lg:grid-cols-5">
          {HERO_CATEGORIES.map((cat, idx) => (
            <Link
              key={cat.label}
              to={cat.href}
              className={cn(
                "group flex flex-col overflow-hidden rounded-[6px] bg-(--sh-home-card) outline-none transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-(--sh-pink)",
                idx === 4 && "col-span-2 mx-auto w-full max-w-[calc(50%-0.5rem)] lg:col-span-1 lg:max-w-none"
              )}
            >
              <div className="aspect-[272/232] overflow-hidden bg-(--sh-surface)">
                <img
                  src={picsumId(cat.imageId, 544, 464)}
                  alt=""
                  width={544}
                  height={464}
                  className={cn(
                    "size-full object-cover transition-transform duration-300 group-hover:scale-105",
                    cat.grayscale && "grayscale"
                  )}
                />
              </div>
              <div className="flex h-12 items-center px-3 text-base font-semibold text-(--sh-fg) md:h-[62px] md:text-xl">
                {cat.label}
              </div>
            </Link>
          ))}
        </div>

        {/* Hàng 4 cam kết */}
        <div className="mt-12 flex flex-col items-center justify-center gap-3 text-base text-(--sh-fg) sm:flex-row sm:flex-wrap sm:gap-x-10 md:mt-20 md:text-xl">
          {HERO_COMMITMENTS.map((c) => (
            <div key={c} className="flex items-center gap-2 font-medium">
              <Check className="size-5 shrink-0 text-(--sh-fg)" strokeWidth={2.5} aria-hidden="true" />
              <span>{c}</span>
            </div>
          ))}
        </div>

        {/* Nút chính */}
        <div className="mt-12 flex justify-center md:mt-24">
          <ShopButton id="hero-cta-button" asChild variant="primary" className="h-12 rounded-[4px] px-8 text-lg">
            <Link to="/luts">Khám phá kho LUT</Link>
          </ShopButton>
        </div>
      </div>
    </section>
  );
}
