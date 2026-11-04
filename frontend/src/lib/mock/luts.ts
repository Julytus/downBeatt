import { MOCK_CATEGORIES, MOCK_LUTS } from "@/lib/mock/data/luts";
import type { PagingDTO } from "@/lib/types/paging";
import type {
  LutCategoryDTO,
  LutDTO,
  LutListApiRequest,
  LutListResponseDTO
} from "@/lib/types/lut";

/**
 * API giả cho kho LUT: cùng chữ ký với hàm axios sau này (`lib/axios/luts.ts`).
 * Khi backend sẵn sàng, chỉ cần đổi import trong `lib/tanstack/options/luts.ts`.
 */
const LATENCY_MS = 300;

export const delay = (ms = LATENCY_MS) => new Promise((r) => setTimeout(r, ms));

/** Lỗi 404 giả, giống lỗi DATA_NOT_FOUND của backend */
export class NotFoundError extends Error {
  readonly status = 404;
}

const normalize = (s: string) => s.normalize("NFC").toLowerCase().trim();

const matches = (lut: LutDTO, term: string) =>
  normalize(lut.title).includes(term) ||
  normalize(lut.creator).includes(term) ||
  lut.tags.some((t) => normalize(t).includes(term));

export async function getLuts(req: LutListApiRequest = {}): Promise<LutListResponseDTO> {
  const { q, keywords = [], styles = [], sort = "relevance", category, paging } = req;
  const page = paging?.page ?? 1;
  const limit = paging?.limit ?? 12;

  const terms = [q ?? "", ...keywords].map(normalize).filter(Boolean);
  const list = MOCK_LUTS.filter(
    (l) =>
      (!category || l.categories.includes(category)) &&
      (styles.length === 0 || styles.includes(l.style)) &&
      terms.every((t) => matches(l, t))
  );

  if (sort === "newest") list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (sort === "popular") list.sort((a, b) => b.downloads - a.downloads);

  await delay();
  return { total: list.length, page, items: list.slice((page - 1) * limit, page * limit) };
}

export async function getLut(slug: string): Promise<LutDTO> {
  await delay();
  const lut = MOCK_LUTS.find((l) => l.slug === slug);
  if (!lut) throw new NotFoundError("Không tìm thấy LUT");
  return lut;
}

/** LUT liên quan: cùng phong cách / danh mục trước, rồi tới phổ biến nhất. Không gồm chính nó. */
export async function getRelatedLuts(
  slug: string,
  paging: PagingDTO = {}
): Promise<LutListResponseDTO> {
  const page = paging.page ?? 1;
  const limit = paging.limit ?? 12;
  const base = MOCK_LUTS.find((l) => l.slug === slug);
  const score = (l: LutDTO) =>
    !base
      ? 0
      : (l.style === base.style ? 10 : 0) +
        l.categories.filter((c) => base.categories.includes(c)).length;
  const list = MOCK_LUTS.filter((l) => l.slug !== slug).sort(
    (a, b) => score(b) - score(a) || b.downloads - a.downloads
  );
  await delay();
  return { total: list.length, page, items: list.slice((page - 1) * limit, page * limit) };
}

/** Gợi ý ở ô tìm kiếm header: tối đa `limit` LUT khớp tên / tác giả / thẻ. */
export async function getLutSuggestions(q: string, limit = 4): Promise<LutDTO[]> {
  const term = normalize(q);
  await delay(150);
  const list = term ? MOCK_LUTS.filter((l) => matches(l, term)) : [...MOCK_LUTS];
  return list.sort((a, b) => b.downloads - a.downloads).slice(0, limit);
}

export async function getLutCategories(): Promise<LutCategoryDTO[]> {
  await delay(100);
  return MOCK_CATEGORIES;
}

export async function getLutCategory(slug: string): Promise<LutCategoryDTO> {
  await delay(100);
  const category = MOCK_CATEGORIES.find((c) => c.slug === slug);
  if (!category) throw new NotFoundError("Không tìm thấy danh mục");
  return category;
}
