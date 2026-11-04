import type { LutCategoryDTO, LutDTO } from "@/lib/types/lut";

/** Ảnh minh hoạ ngẫu nhiên theo seed (picsum). Khi có ảnh thật, thay bằng URL từ backend. */
export const picsum = (seed: string, w = 640, h = 360) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

/** "Hoàng Hôn Sài Gòn" → "hoang-hon-sai-gon" */
export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

type Seed = Omit<
  LutDTO,
  "coverUrl" | "slug" | "categories" | "description" | "fileSizeKb" | "previewType" | "previewVideoUrl"
> & {
  seed: string;
  description?: string;
};

/** Video mẫu CC0 (MDN). LUT có video xem trước; các LUT còn lại dùng ảnh trước / sau. */
const SAMPLE_VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos";
const VIDEO_PREVIEWS: Record<string, string> = {
  "2": `${SAMPLE_VIDEO}/friday.mp4`,
  "14": `${SAMPLE_VIDEO}/flower.mp4`,
  "23": `${SAMPLE_VIDEO}/friday.mp4`,
  "27": `${SAMPLE_VIDEO}/flower.mp4`
};

const SEEDS: Seed[] = [
  { id: "1", title: "Xanh Điện Ảnh", coverText: "XANH ĐIỆN ẢNH", coverTextStyle: "bold", creator: "Minh Color", style: "teal-orange", tags: ["teal", "điện ảnh"], premium: false, downloads: 18840, seed: "teal-sky", previewFilter: "saturate(1.5) hue-rotate(-12deg) contrast(1.15)", createdAt: "2026-10-01" },
  { id: "2", title: "Chuẩn Điện Ảnh", coverText: "CHUẨN ĐIỆN ẢNH", coverTextStyle: "caption", creator: "DownBeat Studio", style: "dien-anh", tags: ["điện ảnh", "trung tính"], premium: false, downloads: 15210, seed: "office", previewFilter: "contrast(1.2) saturate(0.9) brightness(0.92)", createdAt: "2026-09-12" },
  { id: "3", title: "Cổ Điển", coverText: "Cổ Điển", coverTextStyle: "serif", creator: "Analog Lab", style: "co-dien", tags: ["vintage", "ấm"], premium: false, downloads: 13420, seed: "seaside", previewFilter: "sepia(0.45) saturate(1.2) contrast(0.95) brightness(1.05)", createdAt: "2026-08-20" },
  { id: "4", title: "Vũ Điệu Bóng Tối", coverText: "BÓNG TỐI", coverTextStyle: "condensed", creator: "Mono Works", style: "dien-anh", tags: ["tương phản", "tối"], premium: true, downloads: 9320, seed: "stadium", previewFilter: "contrast(1.35) saturate(0.85) brightness(0.85)", createdAt: "2026-10-18" },
  { id: "5", title: "Điện Ảnh Thuần", coverText: "ĐIỆN ẢNH", coverTextStyle: "spaced", creator: "Wander Grade", style: "am-ap", tags: ["ấm", "thiên nhiên"], premium: false, downloads: 11050, seed: "lake-girl", previewFilter: "sepia(0.35) saturate(1.3) hue-rotate(-8deg)", createdAt: "2026-07-03" },
  { id: "6", title: "Chân Dung Mềm", creator: "Minh Color", style: "phim-nhua", tags: ["chân dung", "pastel"], premium: false, downloads: 6120, seed: "portrait", previewFilter: "saturate(0.85) brightness(1.06) contrast(0.92) sepia(0.12)", createdAt: "2026-10-25" },
  { id: "7", title: "Bùng Nổ", coverText: "BÙNG NỔ", coverTextStyle: "outline", creator: "DownBeat Studio", style: "du-lich", tags: ["rực rỡ", "phong cảnh"], premium: false, downloads: 10240, seed: "alps", previewFilter: "saturate(1.7) contrast(1.15)", createdAt: "2026-09-30" },
  { id: "8", title: "Xanh Đêm", coverText: "Xanh Đêm", coverTextStyle: "serif", creator: "Mono Works", style: "lanh", tags: ["lạnh", "xanh", "đêm"], premium: true, downloads: 8890, seed: "blue-man", previewFilter: "saturate(0.9) hue-rotate(25deg) brightness(0.9) contrast(1.1)", createdAt: "2026-10-10" },
  { id: "9", title: "Hoàng Hôn Sài Gòn", coverText: "HOÀNG HÔN", coverTextStyle: "bold", creator: "Minh Color", style: "am-ap", tags: ["hoàng hôn", "ấm"], premium: false, downloads: 9760, seed: "saigon", previewFilter: "sepia(0.4) saturate(1.4) hue-rotate(-10deg)", createdAt: "2026-06-14" },
  { id: "10", title: "Kodak 400", coverText: "KODAK 400", coverTextStyle: "condensed", creator: "Analog Lab", style: "phim-nhua", tags: ["phim", "grain"], premium: true, downloads: 14980, seed: "kodak", previewFilter: "sepia(0.2) saturate(1.15) contrast(0.95) brightness(1.05)", createdAt: "2026-05-02" },
  { id: "11", title: "Noir", coverText: "NOIR", coverTextStyle: "caption", creator: "Mono Works", style: "den-trang", tags: ["đen trắng"], premium: false, downloads: 7430, seed: "noir", previewFilter: "grayscale(1) contrast(1.35)", createdAt: "2026-04-21" },
  { id: "12", title: "Đà Lạt Sương", coverText: "Đà Lạt", coverTextStyle: "serif", creator: "Wander Grade", style: "lanh", tags: ["sương", "lạnh"], premium: false, downloads: 5310, seed: "dalat", previewFilter: "saturate(0.8) hue-rotate(15deg) brightness(1.08) contrast(0.9)", createdAt: "2026-10-28" },
  { id: "13", title: "Retro 1970", coverText: "RETRO 70", coverTextStyle: "outline", creator: "Analog Lab", style: "co-dien", tags: ["vintage", "phai màu"], premium: false, downloads: 8120, seed: "retro", previewFilter: "sepia(0.55) contrast(0.9) brightness(1.02)", createdAt: "2026-03-11" },
  { id: "14", title: "Neo Tokyo", coverText: "NEO TOKYO", coverTextStyle: "condensed", creator: "DownBeat Studio", style: "dien-anh", tags: ["neon", "đêm"], premium: true, downloads: 10870, seed: "tokyo", previewFilter: "saturate(1.7) hue-rotate(25deg) contrast(1.15)", createdAt: "2026-09-05" },
  { id: "15", title: "Bạc Xám", coverText: "BẠC XÁM", coverTextStyle: "spaced", creator: "Mono Works", style: "den-trang", tags: ["đen trắng", "mềm"], premium: false, downloads: 4410, seed: "silver", previewFilter: "grayscale(1) brightness(1.08) contrast(0.95)", createdAt: "2026-08-08" },
  { id: "16", title: "Biển Phú Quốc", coverText: "PHÚ QUỐC", coverTextStyle: "bold", creator: "Wander Grade", style: "du-lich", tags: ["biển", "tươi"], premium: false, downloads: 6650, seed: "beach", previewFilter: "saturate(1.6) brightness(1.08) hue-rotate(-5deg)", createdAt: "2026-07-22" },
  { id: "17", title: "Mùa Thu Hà Nội", coverText: "Mùa Thu", coverTextStyle: "serif", creator: "Minh Color", style: "am-ap", tags: ["ấm", "lá vàng"], premium: false, downloads: 7980, seed: "autumn", previewFilter: "sepia(0.4) saturate(1.3) hue-rotate(-12deg)", createdAt: "2026-10-30" },
  { id: "18", title: "Băng Giá", coverText: "BĂNG GIÁ", coverTextStyle: "caption", creator: "Wander Grade", style: "lanh", tags: ["lạnh", "xanh"], premium: true, downloads: 3920, seed: "ice", previewFilter: "saturate(0.9) hue-rotate(30deg) brightness(1.05) contrast(1.05)", createdAt: "2026-11-01" },
  { id: "19", title: "Fuji Classic", coverText: "FUJI CLASSIC", coverTextStyle: "bold", creator: "Analog Lab", style: "phim-nhua", tags: ["phim", "trầm"], premium: false, downloads: 12300, seed: "fuji", previewFilter: "saturate(0.75) contrast(1.12) sepia(0.12)", createdAt: "2026-02-14" },
  { id: "20", title: "Sử Thi", coverText: "SỬ THI", coverTextStyle: "condensed", creator: "DownBeat Studio", style: "dien-anh", tags: ["điện ảnh", "tối"], premium: true, downloads: 11760, seed: "epic", previewFilter: "contrast(1.25) saturate(1.2) brightness(0.88) hue-rotate(-10deg)", createdAt: "2026-08-29" },
  { id: "21", title: "Ngày Cưới", coverText: "Ngày Cưới", coverTextStyle: "serif", creator: "Wedding Tone", style: "am-ap", tags: ["cưới", "pastel", "ấm"], premium: true, downloads: 9140, seed: "wedding", previewFilter: "sepia(0.2) saturate(0.95) brightness(1.08) contrast(0.92)", createdAt: "2026-10-20" },
  { id: "22", title: "Lụa Trắng", coverText: "LỤA TRẮNG", coverTextStyle: "spaced", creator: "Wedding Tone", style: "phim-nhua", tags: ["cưới", "mềm"], premium: false, downloads: 5870, seed: "silk", previewFilter: "saturate(0.8) brightness(1.1) contrast(0.9)", createdAt: "2026-09-18" },
  { id: "23", title: "Phố Đêm", coverText: "PHỐ ĐÊM", coverTextStyle: "condensed", creator: "Mono Works", style: "dien-anh", tags: ["đêm", "neon", "đường phố"], premium: false, downloads: 8350, seed: "street-night", previewFilter: "saturate(1.4) hue-rotate(15deg) contrast(1.2) brightness(0.9)", createdAt: "2026-10-05" },
  { id: "24", title: "Rừng Nhiệt Đới", coverText: "NHIỆT ĐỚI", coverTextStyle: "bold", creator: "Wander Grade", style: "du-lich", tags: ["rừng", "xanh lá", "rực rỡ"], premium: true, downloads: 6990, seed: "jungle", previewFilter: "saturate(1.5) hue-rotate(10deg) contrast(1.1)", createdAt: "2026-08-12" },
  { id: "25", title: "Mật Ong", coverText: "MẬT ONG", coverTextStyle: "outline", creator: "Minh Color", style: "am-ap", tags: ["vàng", "ấm", "chân dung"], premium: false, downloads: 10410, seed: "honey", previewFilter: "sepia(0.5) saturate(1.5) hue-rotate(-15deg) brightness(1.02)", createdAt: "2026-07-30" },
  { id: "26", title: "Chì Than", coverText: "CHÌ THAN", coverTextStyle: "caption", creator: "Mono Works", style: "den-trang", tags: ["đen trắng", "tương phản"], premium: true, downloads: 5020, seed: "charcoal", previewFilter: "grayscale(1) contrast(1.5) brightness(0.9)", createdAt: "2026-06-02" },
  { id: "27", title: "Pastel Hồng", coverText: "PASTEL", coverTextStyle: "serif", creator: "Studio Kem", style: "phim-nhua", tags: ["pastel", "hồng", "chân dung"], premium: false, downloads: 7240, seed: "pastel", previewFilter: "saturate(0.7) brightness(1.12) hue-rotate(-20deg) contrast(0.88)", createdAt: "2026-10-12" },
  { id: "28", title: "Sa Mạc", coverText: "SA MẠC", coverTextStyle: "spaced", creator: "Wander Grade", style: "du-lich", tags: ["cát", "ấm", "phong cảnh"], premium: false, downloads: 4780, seed: "desert", previewFilter: "sepia(0.45) saturate(1.25) contrast(1.05)", createdAt: "2026-05-19" },
  { id: "29", title: "Bắc Cực", coverText: "BẮC CỰC", coverTextStyle: "condensed", creator: "Studio Kem", style: "lanh", tags: ["lạnh", "tuyết"], premium: false, downloads: 6310, seed: "arctic", previewFilter: "saturate(0.7) hue-rotate(35deg) brightness(1.1)", createdAt: "2026-09-25" },
  { id: "30", title: "Teal Mùa Hè", coverText: "TEAL HÈ", coverTextStyle: "bold", creator: "Minh Color", style: "teal-orange", tags: ["teal", "hè", "rực rỡ"], premium: true, downloads: 12880, seed: "summer", previewFilter: "saturate(1.6) hue-rotate(-18deg) contrast(1.12)", createdAt: "2026-07-08" },
  { id: "31", title: "Cam Cháy", coverText: "CAM CHÁY", coverTextStyle: "outline", creator: "DownBeat Studio", style: "teal-orange", tags: ["cam", "tương phản"], premium: false, downloads: 9530, seed: "orange-burn", previewFilter: "saturate(1.45) sepia(0.2) contrast(1.18) hue-rotate(-8deg)", createdAt: "2026-04-03" },
  { id: "32", title: "Super 8", coverText: "SUPER 8", coverTextStyle: "caption", creator: "Analog Lab", style: "co-dien", tags: ["phim", "vintage", "grain"], premium: true, downloads: 8670, seed: "super8", previewFilter: "sepia(0.6) contrast(1.05) saturate(1.1) brightness(0.98)", createdAt: "2026-10-22" },
  { id: "33", title: "Mưa Phố", coverText: "Mưa Phố", coverTextStyle: "serif", creator: "Studio Kem", style: "lanh", tags: ["mưa", "đường phố", "trầm"], premium: false, downloads: 3980, seed: "rain-city", previewFilter: "saturate(0.75) hue-rotate(20deg) contrast(1.08) brightness(0.95)", createdAt: "2026-11-03" },
  { id: "34", title: "Vlog Tươi", coverText: "VLOG", coverTextStyle: "bold", creator: "DownBeat Studio", style: "du-lich", tags: ["vlog", "tươi", "rực rỡ"], premium: false, downloads: 15640, seed: "vlog", previewFilter: "saturate(1.35) brightness(1.06) contrast(1.05)", createdAt: "2026-09-09" },
  { id: "35", title: "Hồi Ức", coverText: "HỒI ỨC", coverTextStyle: "spaced", creator: "Analog Lab", style: "co-dien", tags: ["vintage", "phai màu", "cưới"], premium: false, downloads: 6880, seed: "memory", previewFilter: "sepia(0.35) saturate(0.85) contrast(0.9) brightness(1.05)", createdAt: "2026-08-01" },
  { id: "36", title: "Ánh Trăng", coverText: "ÁNH TRĂNG", coverTextStyle: "condensed", creator: "Mono Works", style: "lanh", tags: ["đêm", "xanh", "tối"], premium: true, downloads: 7710, seed: "moonlight", previewFilter: "saturate(0.8) hue-rotate(28deg) brightness(0.82) contrast(1.2)", createdAt: "2026-10-27" }
];

/** Danh mục: trang /luts/danh-muc/<slug>. `match` chỉ dùng trong dữ liệu mẫu để xếp LUT vào danh mục. */
const CATEGORY_DEFS: (LutCategoryDTO & { match: (s: Seed) => boolean })[] = [
  { slug: "dien-anh", name: "Điện ảnh", group: "phong-cach", popular: true, description: "Tông màu như phim chiếu rạp: tương phản sâu, vùng tối dày, da người vẫn tự nhiên.", match: (s) => s.style === "dien-anh" || s.tags.includes("điện ảnh") },
  { slug: "co-dien", name: "Cổ điển", group: "phong-cach", description: "Màu phai nhẹ, vàng ấm như ảnh cũ, hợp vlog hoài niệm và MV.", match: (s) => s.style === "co-dien" || s.tags.includes("vintage") },
  { slug: "phim-nhua", name: "Phim nhựa", group: "phong-cach", popular: true, description: "Mô phỏng các dòng film Kodak, Fuji: grain nhẹ, màu mềm và có chiều sâu.", match: (s) => s.style === "phim-nhua" || s.tags.includes("phim") },
  { slug: "den-trang", name: "Đen trắng", group: "phong-cach", description: "Đen trắng nhiều sắc độ, từ mềm mại đến tương phản mạnh.", match: (s) => s.style === "den-trang" },
  { slug: "am-ap", name: "Ấm áp", group: "tong-mau", description: "Vàng cam ấm, hợp hoàng hôn, chân dung và khung cảnh mùa thu.", match: (s) => s.style === "am-ap" || s.tags.includes("ấm") },
  { slug: "lanh", name: "Lạnh", group: "tong-mau", description: "Xanh lạnh và trầm, tạo cảm giác yên tĩnh, bí ẩn.", match: (s) => s.style === "lanh" || s.tags.includes("lạnh") },
  { slug: "teal-orange", name: "Teal & Orange", group: "tong-mau", popular: true, description: "Cặp màu bổ túc kinh điển của Hollywood: nền xanh mòng két, da cam ấm.", match: (s) => s.style === "teal-orange" || s.tags.includes("teal") },
  { slug: "ruc-ro", name: "Rực rỡ", group: "tong-mau", description: "Màu bão hoà, tươi sáng, nổi bật trên mạng xã hội.", match: (s) => s.tags.some((t) => ["rực rỡ", "neon", "tươi"].includes(t)) },
  { slug: "du-lich", name: "Du lịch", group: "dip", popular: true, description: "Làm nổi bật trời, biển và phong cảnh cho video du lịch.", match: (s) => s.style === "du-lich" || s.tags.some((t) => ["biển", "phong cảnh"].includes(t)) },
  { slug: "dam-cuoi", name: "Đám cưới", group: "dip", popular: true, description: "Da sáng, màu mềm và lãng mạn cho phóng sự cưới.", match: (s) => s.tags.includes("cưới") },
  { slug: "chan-dung", name: "Chân dung", group: "dip", description: "Giữ màu da đẹp, tách chủ thể khỏi nền.", match: (s) => s.tags.includes("chân dung") },
  { slug: "ban-dem", name: "Ban đêm", group: "dip", description: "Giữ chi tiết vùng tối, làm đèn đường và neon thêm lung linh.", match: (s) => s.tags.some((t) => ["đêm", "tối"].includes(t)) },
  { slug: "premiere-pro", name: "Premiere Pro", group: "phan-mem", description: "LUT .cube dùng ngay trong Lumetri Color của Premiere Pro.", match: () => true },
  { slug: "davinci-resolve", name: "DaVinci Resolve", group: "phan-mem", popular: true, description: "Kéo thả vào node Color của DaVinci Resolve.", match: () => true },
  { slug: "final-cut-pro", name: "Final Cut Pro", group: "phan-mem", description: "Dùng với hiệu ứng Custom LUT của Final Cut Pro.", match: () => true },
  { slug: "capcut", name: "CapCut", group: "phan-mem", description: "Nhập LUT vào mục Điều chỉnh của CapCut bản máy tính.", match: () => true }
];

export const MOCK_CATEGORIES: LutCategoryDTO[] = CATEGORY_DEFS.map((c) => ({
  slug: c.slug,
  name: c.name,
  group: c.group,
  description: c.description,
  popular: c.popular
}));

const describe = (s: Seed) =>
  s.description ??
  `${s.title} là LUT phong cách ${s.tags.slice(0, 2).join(", ")} do ${s.creator} chỉnh màu. ` +
    "Kéo thả file .cube vào phần mềm dựng phim để áp ngay, chỉnh cường độ cho hợp với cảnh quay của bạn.";

export const MOCK_LUTS: LutDTO[] = SEEDS.map(({ seed, ...rest }, i) => ({
  ...rest,
  slug: slugify(rest.title),
  description: describe(rest as Seed),
  categories: CATEGORY_DEFS.filter((c) => c.match(rest as Seed)).map((c) => c.slug),
  fileSizeKb: 820 + ((i * 137) % 900),
  coverUrl: picsum(seed),
  previewType: VIDEO_PREVIEWS[rest.id] ? "video" : "before-after",
  previewVideoUrl: VIDEO_PREVIEWS[rest.id]
}));
