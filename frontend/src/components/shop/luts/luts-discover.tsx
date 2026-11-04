import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Clapperboard, Film, Heart, MonitorPlay, Palette, Plane } from "lucide-react";
import { lutCategoriesQueryOptions } from "@/lib/tanstack/options/luts";
import { LUT_CATEGORY_GROUP_LABEL, type LutCategoryGroup } from "@/lib/types/lut";

const POPULAR_ICON: Record<string, typeof Film> = {
  "dien-anh": Clapperboard,
  "phim-nhua": Film,
  "teal-orange": Palette,
  "du-lich": Plane,
  "dam-cuoi": Heart,
  "davinci-resolve": MonitorPlay
};

/** Khối "Danh mục phổ biến" + "Tất cả danh mục" dưới lưới LUT */
export function LutsDiscover() {
  const { data: categories = [] } = useQuery(lutCategoriesQueryOptions);
  const groups = Object.keys(LUT_CATEGORY_GROUP_LABEL) as LutCategoryGroup[];

  return (
    <section aria-labelledby="luts-categories-title" className="mt-16">
      <h2 id="luts-categories-title" className="text-lg font-bold">
        Danh mục phổ biến
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {categories
          .filter((c) => c.popular)
          .map((c) => {
            const Icon = POPULAR_ICON[c.slug] ?? Palette;
            return (
              <li key={c.slug}>
                <Link
                  to="/luts/danh-muc/$category"
                  params={{ category: c.slug }}
                  className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-(--sh-surface) px-3 text-sm font-semibold transition-colors hover:bg-(--sh-surface-hover)"
                >
                  <Icon className="size-4 text-(--sh-pink)" aria-hidden />
                  {c.name}
                </Link>
              </li>
            );
          })}
      </ul>

      <h2 className="mt-10 text-lg font-bold">Tất cả danh mục</h2>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        {groups.map((g) => (
          <div key={g}>
            <h3 className="text-sm font-semibold">{LUT_CATEGORY_GROUP_LABEL[g]}</h3>
            <ul className="mt-3 flex flex-col gap-1">
              {categories
                .filter((c) => c.group === g)
                .map((c) => (
                  <li key={c.slug}>
                    <Link
                      to="/luts/danh-muc/$category"
                      params={{ category: c.slug }}
                      className="inline-flex min-h-6 items-center text-sm text-(--sh-muted) transition-colors hover:text-(--sh-fg) hover:underline"
                    >
                      LUT {c.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
