import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, ChevronRight } from "lucide-react";
import { useCallback, useEffect } from "react";
import { LutBrowser } from "@/components/shop/luts/lut-browser";
import { LutsDiscover } from "@/components/shop/luts/luts-discover";
import { ShopError } from "@/components/shop/ui/shop-error";
import { ShopNotFound } from "@/components/shop/ui/shop-not-found";
import { isNotFoundError } from "@/lib/axios/luts";
import { lutsSearchSchema, type LutsSearch } from "@/lib/search/luts";
import { queryClient } from "@/lib/tanstack/query-client";
import { createLutCategoryQueryOptions } from "@/lib/tanstack/options/luts";

export const Route = createFileRoute("/_shop/luts/danh-muc/$category")({
  validateSearch: lutsSearchSchema,
  loader: async ({ params }) => {
    try {
      await queryClient.ensureQueryData(createLutCategoryQueryOptions(params.category));
    } catch (err) {
      if (isNotFoundError(err)) throw notFound();
      throw err;
    }
  },
  notFoundComponent: () => (
    <ShopNotFound title="Không tìm thấy danh mục" description="Danh mục này không tồn tại. Hãy xem toàn bộ kho LUT." />
  ),
  errorComponent: ({ reset }) => <ShopError title="Không tải được danh mục" onRetry={reset} />,
  component: CategoryPage
});

const PERKS = ["Chỉnh màu chuyên nghiệp", "Không lo bản quyền", "Tải về dùng ngay"];

function CategoryPage() {
  const { category: slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: category } = useSuspenseQuery(createLutCategoryQueryOptions(slug));

  const onSearchChange = useCallback(
    (next: LutsSearch) => navigate({ search: next, replace: true, resetScroll: false }),
    [navigate]
  );

  useEffect(() => {
    document.title = `LUT ${category.name} | DownBeat`;
  }, [category]);

  return (
    <>
      <nav aria-label="Đường dẫn" className="text-sm text-(--sh-muted)">
        <ol className="flex items-center gap-1">
          <li>
            <Link to="/luts" className="hover:text-(--sh-fg) hover:underline">
              Kho LUT
            </Link>
          </li>
          <li aria-current="page" className="flex items-center gap-1 text-(--sh-fg)">
            <ChevronRight className="size-3.5 text-(--sh-muted)" aria-hidden />
            LUT {category.name}
          </li>
        </ol>
      </nav>

      <header className="mt-4 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-bold tracking-[-0.5px] md:text-5xl">LUT {category.name}</h1>
          <p className="mt-3 leading-7 text-(--sh-muted)">{category.description}</p>
        </div>
        <ul className="flex shrink-0 flex-col gap-1.5 text-sm font-semibold">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <Check className="size-4 text-(--sh-success)" aria-hidden />
              {p}
            </li>
          ))}
        </ul>
      </header>

      <div className="mt-10">
        <LutBrowser
          key={slug}
          search={search}
          onSearchChange={onSearchChange}
          category={slug}
          label={`Danh sách LUT ${category.name}`}
        />
      </div>
      <LutsDiscover />
    </>
  );
}
