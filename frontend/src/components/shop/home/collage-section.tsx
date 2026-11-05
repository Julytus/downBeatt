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
      className="px-4 py-16 md:px-8 md:py-24"
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
        {/* Cột chữ */}
        <div>
          <h2
            id="collage-title"
            className="font-display text-2xl font-bold tracking-tight text-(--sh-fg) md:text-4xl"
          >
            <span className="block">Sáng tạo,</span>
            <span className="block text-(--sh-accent)">là bản năng của chúng tôi</span>
          </h2>
          <p className="mt-4 text-sm text-(--sh-muted) md:text-base">
            Những bộ LUT tuyển chọn theo trào lưu, làm ra để khơi cảm hứng.
          </p>
        </div>

        {/* Cụm 12 ảnh bìa LUT: không khung, bố cục tự do thưa, tỉ lệ cố định 5/4 */}
        <div className="relative aspect-[5/4] w-full max-w-[620px] overflow-hidden">
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
                  <Skeleton className="aspect-[4/3] w-full rounded-[8px] bg-(--sh-surface)" />
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
                        className="block aspect-[4/3] w-full overflow-hidden rounded-[8px] bg-(--sh-surface) shadow-md outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-(--sh-pink)"
                      >
                        <LutCover
                          coverUrl={lut.coverUrl}
                          previewFilter={lut.previewFilter}
                          coverText={lut.coverText}
                          coverTextStyle={lut.coverTextStyle}
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
