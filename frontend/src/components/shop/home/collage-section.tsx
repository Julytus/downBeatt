import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { LutCover } from "@/components/shop/luts/lut-card";
import { Skeleton } from "@/components/ui/skeleton";
import { homeFeaturedLutsQueryOptions } from "@/lib/tanstack/options/luts";
import { COLLAGE_POSITIONS } from "./home-data";

export function CollageSection() {
  const { data, isPending } = useQuery(homeFeaturedLutsQueryOptions);
  const luts = data?.items ?? [];

  return (
    <section
      aria-labelledby="collage-title"
      className="bg-(--sh-home-b) px-4 py-16 md:px-8 md:py-32"
    >
      <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[1fr_600px] lg:items-center">
        {/* Cột chữ */}
        <div>
          <h2
            id="collage-title"
            className="font-display text-3xl leading-[1.1] font-bold text-(--sh-fg) md:text-5xl"
          >
            <span className="block">Sáng tạo,</span>
            <span className="block">là bản năng của chúng tôi</span>
          </h2>
          <p className="mt-6 max-w-[330px] text-base leading-7 text-(--sh-fg) md:text-lg">
            Những bộ LUT tuyển chọn theo trào lưu, làm ra để khơi cảm hứng.
          </p>
        </div>

        {/* Cụm 12 ảnh bìa LUT vuông, bố cục tự do thưa (vùng 660×430) */}
        <div className="relative aspect-[660/430] w-full max-w-[600px]">
          {isPending || luts.length === 0
            ? COLLAGE_POSITIONS.map((pos, idx) => (
                <div
                  key={idx}
                  className="absolute"
                  style={{
                    left: `${pos.left}%`,
                    top: `${pos.top}%`,
                    width: `${pos.width}%`,
                    zIndex: pos.zIndex
                  }}
                >
                  <Skeleton className="aspect-square w-full rounded-[4px] bg-(--sh-surface)" />
                </div>
              ))
            : luts.slice(0, 12).map((lut, idx) => {
                const pos = COLLAGE_POSITIONS[idx] ?? COLLAGE_POSITIONS[0];
                return (
                  <div
                    key={lut.id}
                    className="absolute"
                    style={{
                      left: `${pos.left}%`,
                      top: `${pos.top}%`,
                      width: `${pos.width}%`,
                      zIndex: pos.zIndex
                    }}
                  >
                    <div
                      className="shop-float"
                      style={{
                        animationDuration: `${pos.floatDuration}s`,
                        animationDelay: `${pos.floatDelay}s`
                      }}
                    >
                      <Link
                        to="/luts/$slug"
                        params={{ slug: lut.slug }}
                        aria-label={lut.title}
                        className="block aspect-square w-full overflow-hidden rounded-[4px] bg-(--sh-surface) shadow-lg outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-(--sh-pink)"
                      >
                        <LutCover
                          coverUrl={lut.coverUrl}
                          title={lut.title}
                          size={pos.size}
                        />
                      </Link>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </section>
  );
}
