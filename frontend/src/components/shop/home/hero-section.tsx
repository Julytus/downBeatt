import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { cn } from "@/lib/utils";
import { HERO_CATEGORIES, HERO_COMMITMENTS, picsumId } from "./home-data";

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-x-clip px-4 pt-12 pb-16 md:px-8 md:pt-20 md:pb-24"
    >
      {/* Trang trí 2 dải lụa màu uốn lượn SVG */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 -left-6 -z-10 [mask-image:linear-gradient(to_bottom,black_70%,transparent)] h-[120%] w-[140px] opacity-80 md:-left-10 md:w-[260px]"
        viewBox="0 0 260 1200"
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="hero-silk-left" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--sh-pink, #f23d75)" />
            <stop offset="50%" stopColor="#c026d3" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <filter id="hero-silk-blur-left" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>
        <path
          d="M20,-10 C180,300 190,450 140,600 C80,800 30,950 80,1210 L170,1210 C120,950 170,800 230,600 C280,450 270,300 110,-10 Z"
          fill="url(#hero-silk-left)"
          filter="url(#hero-silk-blur-left)"
        />
      </svg>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-6 -z-10 [mask-image:linear-gradient(to_bottom,black_60%,transparent)] h-[75%] w-[100px] opacity-40 md:-right-10 md:w-[180px]"
        viewBox="0 0 180 800"
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="hero-silk-right" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--sh-pink, #f23d75)" />
            <stop offset="60%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <filter id="hero-silk-blur-right" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        <path
          d="M100,-10 C20,200 20,350 60,500 C100,650 110,750 80,810 L140,810 C170,750 160,650 120,500 C80,350 80,200 160,-10 Z"
          fill="url(#hero-silk-right)"
          filter="url(#hero-silk-blur-right)"
        />
      </svg>

      <div className="relative mx-auto max-w-6xl">
        <h1
          id="hero-title"
          className="font-display text-center text-3xl font-bold tracking-tight text-(--sh-fg) md:text-5xl lg:text-6xl"
        >
          Màu điện ảnh cho mọi khung hình
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base text-(--sh-muted) md:text-lg">
          LUT chỉnh màu do colorist thật tạo ra, dùng được với mọi phần mềm dựng phim.
        </p>

        {/* 5 ô danh mục */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
          {HERO_CATEGORIES.map((cat, idx) => (
            <Link
              key={cat.label}
              to={cat.href}
              className={cn(
                "group flex flex-col overflow-hidden rounded-[12px] bg-(--sh-surface) outline-none transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-(--sh-pink)",
                idx === 4 && "col-span-2 mx-auto w-full max-w-[calc(50%-0.5rem)] lg:col-span-1 lg:max-w-none"
              )}
            >
              <div className="aspect-[4/3.4] overflow-hidden bg-(--sh-surface)">
                <img
                  src={picsumId(cat.imageId, 400, 340)}
                  alt=""
                  width={400}
                  height={340}
                  className={cn(
                    "size-full object-cover transition-transform duration-300 group-hover:scale-105",
                    cat.grayscale && "grayscale"
                  )}
                />
              </div>
              <div className="py-2.5 text-center text-sm font-semibold text-(--sh-fg)">
                {cat.label}
              </div>
            </Link>
          ))}
        </div>

        {/* Hàng 4 cam kết */}
        <div className="mt-12 flex flex-col items-center justify-center gap-3 text-sm text-(--sh-fg) sm:flex-row sm:gap-6">
          {HERO_COMMITMENTS.map((c) => (
            <div key={c} className="flex items-center gap-1.5 font-medium">
              <Check className="size-4 shrink-0 text-(--sh-success)" aria-hidden="true" />
              <span>{c}</span>
            </div>
          ))}
        </div>

        {/* Nút chính */}
        <div className="mt-8 flex justify-center">
          <ShopButton id="hero-cta-button" asChild variant="primary" className="h-11 px-6 text-base">
            <Link to="/luts">Khám phá kho LUT</Link>
          </ShopButton>
        </div>
      </div>
    </section>
  );
}
