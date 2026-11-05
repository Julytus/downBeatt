import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { COLORISTS, picsumId } from "./home-data";

export function AuthorsSection() {
  return (
    <section
      aria-labelledby="authors-title"
      className="px-4 py-16 md:px-8 md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="authors-title"
          className="font-display text-center text-2xl font-bold tracking-tight text-(--sh-fg) md:text-4xl"
        >
          <span className="block">Nơi quy tụ những colorist</span>
          <span className="block text-(--sh-accent)">độc lập hàng đầu</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-(--sh-muted) md:text-base">
          Màu chuẩn studio, giấy phép đơn giản.
        </p>

        {/* 7 thẻ colorist so le */}
        <div className="mt-12 columns-2 gap-4 space-y-4 md:columns-4">
          {COLORISTS.map((c) => (
            <Link
              key={c.name}
              to="/luts"
              search={{ q: c.name }}
              className="group relative block overflow-hidden rounded-[12px] bg-(--sh-surface) outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-(--sh-pink)"
            >
              <img
                src={picsumId(c.imageId, 480, c.height)}
                alt=""
                width={480}
                height={c.height}
                loading="lazy"
                className={cn(
                  "w-full object-cover transition-transform duration-300 group-hover:scale-105",
                  c.grayscale && "grayscale"
                )}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-x-3.5 bottom-3.5 text-white">
                <p className="font-display text-base font-bold md:text-lg">
                  {c.name}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-white/80 md:text-sm">
                  {c.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
