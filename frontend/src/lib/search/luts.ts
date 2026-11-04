import { z } from "zod";
import { LUT_SORTS, LUT_STYLES, type LutListFilter } from "@/lib/types/lut";

/**
 * Tham số URL của trang /luts. Giá trị sai (người dùng sửa tay URL) thì bỏ qua thay vì báo lỗi.
 * `kw` = từ khoá thêm ở thanh lọc, `style` = phong cách đã chọn.
 */
export const lutsSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  kw: z.array(z.string().trim().min(1)).optional().catch(undefined),
  style: z.array(z.enum(LUT_STYLES)).optional().catch(undefined),
  sort: z.enum(LUT_SORTS).optional().catch(undefined)
});

export type LutsSearch = z.infer<typeof lutsSearchSchema>;

export const toLutListFilter = (s: LutsSearch): LutListFilter => ({
  q: s.q,
  keywords: s.kw ?? [],
  styles: s.style ?? [],
  sort: s.sort ?? "relevance"
});

export const hasActiveFilters = (s: LutsSearch) =>
  Boolean(s.q || s.kw?.length || s.style?.length);
