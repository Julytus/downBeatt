import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { COLORISTS, picsumId } from "./home-data";

export function AuthorsSection() {
  return (
    <section
      aria-labelledby="authors-title"
      className="bg-(--sh-home-a) px-4 py-16 md:px-8 md:py-28"
    >
      <div className="mx-auto max-w-[1280px]">
        <h2
          id="authors-title"
          className="font-display text-3xl leading-[1.1] font-bold text-(--sh-fg) md:text-5xl"
        >
          <span className="block">Nơi quy tụ những colorist</span>
          <span className="block">độc lập hàng đầu</span>
        </h2>
        <p className="mt-5 max-w-xl text-base text-(--sh-fg) md:text-lg">
          Màu chuẩn studio, giấy phép đơn giản.
        </p>

        {/* 7 thẻ colorist so le */}
        <div className="mt-12 columns-2 gap-4 space-y-4 md:columns-4">
          {COLORISTS.map((c) => (
            <Link
              key={c.name}
              to="/luts"
              search={{ q: c.name }}
              className="group relative block break-inside-avoid overflow-hidden bg-(--sh-surface) outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-(--sh-pink)"
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
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />
              <div className="absolute inset-x-6 bottom-6 text-white">
                <p className="text-lg font-bold md:text-xl">
                  {c.name}
                </p>
                <p className="mt-1 line-clamp-3 text-sm leading-6 text-white md:text-base">
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
