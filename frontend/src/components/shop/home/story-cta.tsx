import { Link } from "@tanstack/react-router";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { useShopDialog } from "@/lib/stores/shop-dialog";
import { useShopSession } from "@/lib/stores/shop-session";
import { picsumId } from "./home-data";

export function StoryCta() {
  const user = useShopSession((s) => s.user);
  const openDialog = useShopDialog((s) => s.open);

  return (
    <section
      aria-labelledby="story-title"
      className="relative overflow-hidden bg-(--sh-bg) pt-16 pb-32 md:pt-24 md:pb-48"
    >
      {/* Dải sóng lớn tràn hết bề ngang ở đáy, nằm dưới ảnh */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[120px] md:h-[220px]"
      >
        <svg
          className="size-full"
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="story-wave-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f23d75" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#e8968f" stopOpacity="0.95" />
            </linearGradient>
            <filter id="story-wave-blur" x="-5%" y="-20%" width="110%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
            </filter>
          </defs>
          {/* Lớp sóng mờ hạt mép trên */}
          <path
            d="M 0,70 C 220,10 420,110 650,40 C 880,-20 1100,80 1440,30 L 1440,220 L 0,220 Z"
            fill="url(#story-wave-grad)"
            filter="url(#story-wave-blur)"
            opacity="0.6"
          />
          {/* Lớp sóng chính nét hơn */}
          <path
            d="M 0,80 C 200,25 440,115 680,45 C 920,-10 1160,85 1440,35 L 1440,220 L 0,220 Z"
            fill="url(#story-wave-grad)"
          />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Cột chữ bên trái */}
          <div>
            <h2
              id="story-title"
              className="font-display text-3xl font-bold tracking-tight text-(--sh-fg) sm:text-4xl md:text-5xl lg:text-6xl"
            >
              <span className="block">Kể câu chuyện của bạn</span>
              <span className="block text-(--sh-accent)">bằng màu sắc</span>
            </h2>

            <div className="mt-8 md:mt-10">
              {!user ? (
                <ShopButton
                  variant="primary"
                  className="h-12 px-8 text-base shadow-md"
                  onClick={() => openDialog({ type: "register" })}
                >
                  Bắt đầu miễn phí
                </ShopButton>
              ) : (
                <ShopButton asChild variant="primary" className="h-12 px-8 text-base shadow-md">
                  <Link to="/luts">Khám phá kho LUT</Link>
                </ShopButton>
              )}
            </div>
          </div>

          {/* 3 ảnh lớn chồng nhau bên phải, ảnh 3 chồng lên dải sóng */}
          <div className="relative mx-auto h-[340px] w-full max-w-[560px] sm:h-[400px] md:h-[440px]">
            {/* Ảnh 1: dọc lớn */}
            <div className="absolute top-0 left-2 aspect-[44/56] w-[54%] overflow-hidden rounded-[4px] shadow-xl">
              <img
                src={picsumId(65, 440, 560)}
                alt=""
                width={440}
                height={560}
                loading="lazy"
                className="size-full object-cover"
              />
            </div>

            {/* Ảnh 2: vuông */}
            <div className="absolute top-6 right-2 aspect-square w-[50%] overflow-hidden rounded-[4px] shadow-xl">
              <img
                src={picsumId(839, 400, 400)}
                alt=""
                width={400}
                height={400}
                loading="lazy"
                className="size-full object-cover"
              />
            </div>

            {/* Ảnh 3: nhỏ có viền 4px màu --sh-bg, nằm đè lên sóng */}
            <div className="absolute bottom-0 left-1/3 z-20 aspect-[32/40] w-[46%] overflow-hidden rounded-[4px] border-4 border-(--sh-bg) shadow-2xl">
              <img
                src={picsumId(129, 320, 400)}
                alt=""
                width={320}
                height={400}
                loading="lazy"
                className="size-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
