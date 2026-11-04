import { SearchField } from "@/components/shop/ui/search-field";
import { picsum } from "@/lib/mock/data/luts";
import { BeforeAfter, useSplitPosition } from "./before-after";

/** Ảnh hero mẫu; khi có ảnh thật thì đặt ở public/ hoặc lấy từ CMS. */
const HERO_IMAGE = picsum("mountain-dusk", 1600, 420);
const HERO_GRADE = "sepia(0.35) saturate(1.6) hue-rotate(-25deg) contrast(1.05)";

interface LutsHeroProps {
  q?: string;
  onSearch: (q: string) => void;
}

export function LutsHero({ q, onSearch }: LutsHeroProps) {
  const split = useSplitPosition(80);

  return (
    <section
      {...split.bind}
      aria-labelledby="luts-hero-title"
      className="relative overflow-hidden rounded-[12px] bg-[#1d5f70]"
    >
      <BeforeAfter
        src={HERO_IMAGE}
        grade={HERO_GRADE}
        alt="Ảnh minh hoạ trước và sau khi áp LUT"
        position={split.position}
        eager
        className="absolute inset-0"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1d5f70]/85 via-[#3b4a66]/40 to-[#f23d75]/35" />
      </BeforeAfter>

      <div className="pointer-events-none relative px-5 pt-8 pb-12 md:px-8 md:pb-20">
        <h1 className="font-display text-sm font-bold tracking-[0.4px] text-(--sh-kicker) uppercase md:text-base">
          LUT miễn phí &amp; preset chỉnh màu
        </h1>
        <p
          id="luts-hero-title"
          className="font-display mt-1 text-4xl leading-[1.13] font-bold tracking-[-1px] text-white md:text-6xl md:tracking-[-2px]"
        >
          LUT tạo nên cảm xúc
        </p>
        <p className="mt-4 max-w-[680px] text-base leading-7 tracking-[0.024px] text-white md:text-lg">
          Từ chỉnh nhẹ tinh tế đến phong cách táo bạo, khám phá các preset chỉnh màu giúp mọi khung
          hình thêm cảm xúc và cá tính.
        </p>
        <SearchField
          key={q ?? ""}
          variant="glass"
          label="Tìm LUT theo phong cách, tác giả hoặc cảm xúc"
          placeholder="Tìm theo phong cách, tác giả hoặc cảm xúc"
          defaultValue={q}
          onSearch={onSearch}
          className="pointer-events-auto mt-10 max-w-[580px]"
        />
      </div>
    </section>
  );
}
