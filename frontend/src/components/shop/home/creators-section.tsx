import { Link } from "@tanstack/react-router";
import { CREATORS, SOFTWARE_LINKS, SOFTWARE_STATIC, picsumId, type CreatorItem } from "./home-data";

function CreatorCard({ creator }: { creator: CreatorItem }) {
  return (
    <div className="group relative aspect-[3/4] w-[150px] shrink-0 overflow-hidden rounded-[12px] bg-(--sh-surface) md:w-[240px]">
      <img
        src={picsumId(creator.imageId, 480, 640)}
        alt=""
        width={480}
        height={640}
        loading="lazy"
        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-x-3 bottom-3">
        <span className="text-sm font-semibold text-white md:text-base">
          {creator.name}
        </span>
      </div>
    </div>
  );
}

export function CreatorsSection() {
  return (
    <section
      aria-labelledby="creators-title"
      className="relative overflow-hidden py-16 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <h2
          id="creators-title"
          className="font-display text-center text-2xl font-bold tracking-tight text-(--sh-fg) md:text-4xl"
        >
          <span className="block">Màu sắc phía sau</span>
          <span className="block text-(--sh-accent)">những nhà sáng tạo nổi bật</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-(--sh-muted) md:text-base">
          Từ vlog du lịch tới MV ca nhạc, rất nhiều video bạn yêu thích được chỉnh màu bằng DownBeat.
        </p>
      </div>

      {/* Băng ảnh chân dung chạy ngang liên tục */}
      <div className="mt-10 overflow-hidden">
        <div className="shop-marquee flex w-max gap-4 hover:[animation-play-state:paused]">
          {/* Danh sách chính */}
          <div className="flex shrink-0 gap-4">
            {CREATORS.map((c) => (
              <CreatorCard key={c.name} creator={c} />
            ))}
          </div>

          {/* Bản lặp để chạy vòng (aria-hidden) */}
          <div aria-hidden="true" className="flex shrink-0 gap-4">
            {CREATORS.map((c, i) => (
              <CreatorCard key={`dup-${i}`} creator={c} />
            ))}
          </div>
        </div>
      </div>

      {/* Phần mềm */}
      <div className="mx-auto mt-12 max-w-5xl px-4 md:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-(--sh-muted)">
          Dùng được với
        </p>
        <div className="mt-4 grid grid-cols-4 items-center gap-4 text-center md:flex md:flex-wrap md:justify-center md:gap-8">
          {SOFTWARE_LINKS.map((s) => (
            <Link
              key={s.name}
              to={s.href}
              className="text-base font-bold text-(--sh-muted) transition-colors hover:text-(--sh-fg) md:text-lg"
            >
              {s.name}
            </Link>
          ))}
          {SOFTWARE_STATIC.map((s) => (
            <span
              key={s}
              className="text-base font-bold text-(--sh-muted)/70 md:text-lg"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
