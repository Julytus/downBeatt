import { Link } from "@tanstack/react-router";
import { CREATORS, SOFTWARE_LINKS, SOFTWARE_STATIC, picsumId, type CreatorItem } from "./home-data";

function CreatorCard({ creator }: { creator: CreatorItem }) {
  return (
    <div className="group relative aspect-[2/3] w-[200px] shrink-0 overflow-hidden rounded-[4px] bg-(--sh-surface) md:w-[360px]">
      <img
        src={picsumId(creator.imageId, 480, 720)}
        alt=""
        width={480}
        height={720}
        loading="lazy"
        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute inset-x-4 bottom-4">
        <span className="text-base font-semibold text-white md:text-lg">
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
      className="overflow-hidden bg-(--sh-home-b) pt-20 pb-20 md:pt-36 md:pb-28"
    >
      {/* relative: chữ nằm trên dải lụa tràn xuống từ hero */}
      <div className="relative mx-auto max-w-6xl px-4 md:px-8">
        <h2
          id="creators-title"
          className="font-display text-center text-3xl leading-[1.15] font-bold tracking-tight text-(--sh-fg) md:text-[60px]"
        >
          <span className="block">Màu sắc phía sau</span>
          <span className="block text-(--sh-home-kicker)">những nhà sáng tạo nổi bật</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[500px] text-center text-base leading-7 text-(--sh-fg) md:text-lg">
          Từ vlog du lịch tới MV ca nhạc, rất nhiều video bạn yêu thích được chỉnh màu bằng DownBeat.
        </p>
      </div>

      {/* Băng ảnh chân dung chạy ngang liên tục */}
      <div className="mt-12 overflow-hidden">
        <div className="shop-marquee flex w-max gap-5 [animation-duration:60s] hover:[animation-play-state:paused]">
          {/* Danh sách chính */}
          <div className="flex shrink-0 gap-5">
            {CREATORS.map((c) => (
              <CreatorCard key={c.name} creator={c} />
            ))}
          </div>

          {/* Bản lặp để chạy vòng (aria-hidden) */}
          <div aria-hidden="true" className="flex shrink-0 gap-5">
            {CREATORS.map((c, i) => (
              <CreatorCard key={`dup-${i}`} creator={c} />
            ))}
          </div>
        </div>
      </div>

      {/* Phần mềm */}
      <div className="mx-auto mt-14 max-w-[1520px] px-4 md:mt-20 md:px-8">
        <p className="sr-only">
          Dùng được với
        </p>
        <div className="grid grid-cols-2 items-center gap-x-4 gap-y-4 text-center sm:grid-cols-4 lg:flex lg:justify-between lg:gap-6">
          {SOFTWARE_LINKS.map((s) => (
            <Link
              key={s.name}
              to={s.href}
              className="font-display text-xl font-bold tracking-tight whitespace-nowrap text-(--sh-muted)/80 transition-colors hover:text-(--sh-fg) lg:text-[26px]"
            >
              {s.name}
            </Link>
          ))}
          {SOFTWARE_STATIC.map((s) => (
            <span
              key={s}
              className="font-display text-xl font-bold tracking-tight whitespace-nowrap text-(--sh-muted)/80 lg:text-[26px]"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
