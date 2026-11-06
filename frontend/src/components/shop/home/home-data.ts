import type { FeatureArtKind } from "./feature-art";

/** Hàm tạo URL ảnh picsum theo id cố định (Claude đã chọn theo chủ đề). Không dùng picsum(seed). */
export function picsumId(id: number, w: number, h: number): string {
  return `https://picsum.photos/id/${id}/${w}/${h}`;
}

export interface HeroCategory {
  label: string;
  href: string;
  imageId: number;
  grayscale?: boolean;
}

export const HERO_CATEGORIES: HeroCategory[] = [
  { label: "Điện ảnh", href: "/luts/danh-muc/dien-anh", imageId: 799 },
  // { label: "Phim nhựa", href: "/luts/danh-muc/phim-nhua", imageId: 250 },
  // { label: "Cổ điển", href: "/luts/danh-muc/co-dien", imageId: 403 },
  { label: "Đen trắng", href: "/luts/danh-muc/den-trang", imageId: 318, grayscale: true },
  // { label: "Du lịch", href: "/luts/danh-muc/du-lich", imageId: 655 }
];

export const HERO_COMMITMENTS = [
  "Bản quyền rõ ràng",
  "Hơn 5.000 nhà sáng tạo tin dùng",
  "Tải không giới hạn",
  "File .cube cho mọi phần mềm"
];

export interface CreatorItem {
  name: string;
  imageId: number;
}

export const CREATORS: CreatorItem[] = [
  { name: "Linh Vlog", imageId: 64 },
  { name: "Hùng Travel", imageId: 1005 },
  { name: "Mai Films", imageId: 823 },
  { name: "Tuấn Lens", imageId: 669 },
  { name: "Ngọc Ánh", imageId: 996 },
  { name: "Khoa Studio", imageId: 453 },
  { name: "Bảo Trần", imageId: 832 },
  { name: "Hà Phương", imageId: 836 }
];

export interface SoftwareLink {
  name: string;
  href: string;
}

export const SOFTWARE_LINKS: SoftwareLink[] = [
  { name: "DaVinci Resolve", href: "/luts/danh-muc/davinci-resolve" },
  { name: "Premiere Pro", href: "/luts/danh-muc/premiere-pro" },
  { name: "Final Cut Pro", href: "/luts/danh-muc/final-cut-pro" },
  { name: "CapCut", href: "/luts/danh-muc/capcut" }
];

export const SOFTWARE_STATIC = [
  "After Effects",
  "Lightroom",
  "Photoshop",
  "OBS Studio"
];

export interface ColoristItem {
  name: string;
  desc: string;
  imageId: number;
  height: number;
  grayscale?: boolean;
}

export const COLORISTS: ColoristItem[] = [
  {
    name: "Minh Color",
    desc: "Colorist 10 năm cho MV và phim quảng cáo",
    imageId: 91,
    height: 750
  },
  {
    name: "Analog Lab",
    desc: "Tái hiện màu film Kodak, Fuji cổ điển",
    imageId: 454,
    height: 625
  },
  {
    name: "Mono Works",
    desc: "Chuyên đen trắng và tông tối tương phản",
    imageId: 1027,
    height: 625,
    grayscale: true
  },
  {
    name: "Wander Grade",
    desc: "Màu du lịch, phong cảnh rực rỡ",
    imageId: 550,
    height: 750
  },
  {
    name: "Wedding Tone",
    desc: "Tông mềm, ấm cho phim cưới",
    imageId: 325,
    height: 750
  },
  {
    name: "Studio Kem",
    desc: "Pastel và tông lạnh nhẹ nhàng",
    imageId: 628,
    height: 625
  },
  {
    name: "DownBeat Studio",
    desc: "Đội ngũ chỉnh màu của DownBeat",
    imageId: 531,
    height: 625
  }
];

export interface CollagePosition {
  left: number; // %
  top: number;  // %
  width: number; // % bề rộng cụm
  size: "sm" | "md";
  floatDuration: number; // s
  floatDelay: number; // s
  zIndex: number;
}

/** 12 vị trí ô vuông theo % (đo từ bản tham chiếu, vùng tỉ lệ 660×430). */
export const COLLAGE_POSITIONS: CollagePosition[] = [
  { left: 0, top: 16.5, width: 17.9, size: "sm", floatDuration: 7.2, floatDelay: 0.2, zIndex: 2 },
  { left: 27.7, top: 10.2, width: 16.8, size: "sm", floatDuration: 8.5, floatDelay: 1.1, zIndex: 2 },
  { left: 43.9, top: 17.7, width: 15.2, size: "sm", floatDuration: 6.8, floatDelay: 0.5, zIndex: 3 },
  { left: 67.9, top: 0, width: 16.2, size: "sm", floatDuration: 7.6, floatDelay: 1.8, zIndex: 2 },
  { left: 76.8, top: 20.5, width: 17.3, size: "sm", floatDuration: 6.5, floatDelay: 0.0, zIndex: 3 },
  { left: 20.9, top: 44, width: 17.9, size: "sm", floatDuration: 8.0, floatDelay: 2.2, zIndex: 4 },
  { left: 51.5, top: 54.7, width: 15.2, size: "sm", floatDuration: 7.0, floatDelay: 0.8, zIndex: 1 },
  { left: 64.8, top: 42.3, width: 17.6, size: "sm", floatDuration: 8.2, floatDelay: 1.4, zIndex: 4 },
  { left: 83.3, top: 54.2, width: 16.7, size: "sm", floatDuration: 6.9, floatDelay: 0.3, zIndex: 2 },
  { left: 8.2, top: 67.7, width: 16.4, size: "sm", floatDuration: 7.7, floatDelay: 1.9, zIndex: 3 },
  { left: 37.4, top: 70.2, width: 17, size: "sm", floatDuration: 7.4, floatDelay: 0.7, zIndex: 3 },
  { left: 70.5, top: 72.3, width: 17.9, size: "sm", floatDuration: 8.8, floatDelay: 1.6, zIndex: 5 }
];

export const SEARCH_PLACEHOLDERS = [
  "Vlog du lịch Đà Lạt buổi sáng",
  "Phim cưới ngoài trời, tông ấm",
  "MV đêm thành phố ánh neon"
];

export const SEARCH_SUGGESTIONS = ["Hoàng hôn", "Cưới", "Neon", "Vintage"];

export interface FeatureItem {
  part1: string;
  part2: string;
  desc: string;
  art: FeatureArtKind;
  /** Lớp màu chữ phần 2 ở giao diện tối */
  tone: string;
}

export const FEATURES: FeatureItem[] = [
  {
    part1: "Người thật,",
    part2: "hỗ trợ thật",
    desc: "Trò chuyện với đội ngũ DownBeat khi cần, không phải chatbot.",
    art: "chat",
    tone: "dark:text-pink-300"
  },
  {
    part1: "Không lo",
    part2: "bản quyền",
    desc: "Giấy phép rõ ràng cho từng gói, đăng video ở đâu cũng yên tâm.",
    art: "shield",
    tone: "dark:text-violet-300"
  },
  {
    part1: "Tìm kiếm",
    part2: "và bộ lọc thông minh",
    desc: "Lọc theo phong cách, từ khoá, độ phổ biến để chọn màu nhanh hơn.",
    art: "filters",
    tone: "dark:text-pink-300"
  },
  {
    part1: "So sánh",
    part2: "trước và sau",
    desc: "Kéo thanh trượt để thấy LUT đổi màu cảnh quay thế nào trước khi tải.",
    art: "compare",
    tone: "dark:text-purple-300"
  },
  {
    part1: "Hàng chục",
    part2: "danh mục",
    desc: "Điện ảnh, phim nhựa, đám cưới, du lịch… đủ cho mọi thể loại video.",
    art: "cloud",
    tone: "dark:text-orange-300"
  },
  {
    part1: "Lưu vào",
    part2: "bộ sưu tập",
    desc: "Đánh dấu LUT yêu thích và gom theo từng dự án.",
    art: "board",
    tone: "dark:text-amber-200"
  },
  {
    part1: "Xem trước",
    part2: "bằng video",
    desc: "Một số LUT có video mẫu để bạn thấy màu khi chuyển động.",
    art: "video",
    tone: "dark:text-sky-300"
  },
  {
    part1: "Một file .cube,",
    part2: "mọi phần mềm",
    desc: "Dùng được với DaVinci Resolve, Premiere Pro, Final Cut Pro, CapCut.",
    art: "cube",
    tone: "dark:text-pink-300"
  }
];

export interface FaqItem {
  q: string;
  a: string;
}

export const HOME_FAQ: FaqItem[] = [
  {
    q: "DownBeat là gì?",
    a: "DownBeat là kho LUT chỉnh màu cho video và ảnh, do các colorist độc lập tạo ra. Bạn tải file .cube về, áp vào phần mềm dựng phim là xong."
  },
  {
    q: "DownBeat có miễn phí không?",
    a: "Có. Tài khoản Miễn phí tải không giới hạn các LUT thường. LUT có dấu ★ cần gói Pro hoặc Studio."
  },
  {
    q: "LUT trên DownBeat có an toàn bản quyền không?",
    a: "Có. Mọi LUT đều có giấy phép rõ ràng theo gói, dùng được cho video đăng trên mọi nền tảng."
  },
  {
    q: "Tôi dùng LUT với phần mềm nào được?",
    a: "Mọi phần mềm đọc được file .cube: DaVinci Resolve, Premiere Pro, Final Cut Pro, CapCut, Lightroom…"
  },
  {
    q: "Thanh toán gói như thế nào?",
    a: "Quét mã VietQR qua payOS từ mọi ngân hàng, gói được kích hoạt ngay sau khi thanh toán."
  },
  {
    q: "Tôi dùng DownBeat cho khách hàng được không?",
    a: "Được, với gói Pro hoặc Studio. Gói Miễn phí chỉ dành cho video cá nhân."
  }
];
