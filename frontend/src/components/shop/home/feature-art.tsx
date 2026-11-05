import { Bookmark, Check, FileCode2, Play, ShieldCheck, X } from "lucide-react";
import { picsumId } from "./home-data";

/** Tranh minh hoạ nhỏ (giao diện thu gọn) cho từng thẻ ở băng tính năng. Nền luôn tối ở cả hai giao diện. */
export type FeatureArtKind = "chat" | "shield" | "filters" | "compare" | "cloud" | "board" | "video" | "cube";

const panel = "rounded-[10px] border border-white/10 bg-[#2c303a] shadow-lg";

function ChatArt() {
  return (
    <div className="flex w-[82%] flex-col gap-2 text-[10px] leading-snug">
      <div className="flex items-end gap-1.5">
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-(--sh-primary) text-[8px] font-bold text-white">
          DB
        </span>
        <p className="rounded-[10px] rounded-bl-[3px] bg-[#2c303a] px-2.5 py-1.5 text-white/85">
          Chào bạn, mình giúp gì được?
        </p>
      </div>
      <p className="self-end rounded-[10px] rounded-br-[3px] bg-(--sh-primary) px-2.5 py-1.5 text-white">
        LUT này dùng cho CapCut được không?
      </p>
      <div className="flex items-end gap-1.5">
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-(--sh-primary) text-[8px] font-bold text-white">
          DB
        </span>
        <p className="rounded-[10px] rounded-bl-[3px] bg-[#2c303a] px-2.5 py-1.5 text-white/85">
          Được nhé, tải file .cube là xong!
        </p>
      </div>
    </div>
  );
}

function ShieldArt() {
  const rows = [
    { name: "Linh Vlog", color: "bg-emerald-400" },
    { name: "Mai Films", color: "bg-sky-400" },
    { name: "Hùng Travel", color: "bg-pink-400" }
  ];
  return (
    <div className={`${panel} w-[78%] p-2.5`}>
      <div className="flex flex-col items-center gap-1 pb-2">
        <ShieldCheck className="size-4 text-emerald-400" />
        <span className="text-[10px] font-semibold text-white">Kênh đã đăng ký</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-2 rounded-[6px] bg-white/5 px-2 py-1.5">
            <span className={`size-4 rounded-full ${r.color}`} />
            <span className="flex-1 text-[9px] text-white/80">{r.name}</span>
            <Check className="size-3 text-emerald-400" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FiltersArt() {
  return (
    <div className={`${panel} w-[84%] p-2.5`}>
      <div className="flex flex-wrap gap-1">
        {["Điện ảnh", "Ấm", "Neon"].map((c) => (
          <span key={c} className="flex items-center gap-0.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-white/85">
            {c} <X className="size-2.5 opacity-60" />
          </span>
        ))}
      </div>
      <div className="mt-2.5 flex justify-between text-[9px] text-white/60">
        <span>Độ phổ biến</span>
        <span>Cao</span>
      </div>
      <div className="relative mt-1 h-1 rounded-full bg-white/15">
        <div className="absolute inset-y-0 left-0 w-[64%] rounded-full bg-(--sh-pink)" />
        <div className="absolute top-1/2 left-[64%] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-(--sh-pink)" />
      </div>
      <div className="mt-2.5 flex items-center gap-2 rounded-[6px] bg-white/5 p-1.5">
        <img src={picsumId(1016, 80, 60)} alt="" width={80} height={60} loading="lazy" className="h-6 w-8 rounded-[3px] object-cover" />
        <span className="text-[9px] font-semibold text-white/90">Hoàng hôn Sài Gòn</span>
      </div>
    </div>
  );
}

function CompareArt() {
  const src = picsumId(1036, 360, 270);
  return (
    <div className="relative h-[78%] w-[86%] overflow-hidden rounded-[8px] shadow-lg">
      <img src={src} alt="" width={360} height={270} loading="lazy" className="absolute inset-0 size-full object-cover [filter:saturate(1.5)_contrast(1.1)_sepia(0.25)]" />
      <img
        src={src}
        alt=""
        width={360}
        height={270}
        loading="lazy"
        className="absolute inset-0 size-full object-cover [clip-path:inset(0_50%_0_0)] [filter:saturate(0.35)_brightness(0.95)]"
      />
      <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white" />
      <div className="absolute top-1/2 left-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[9px] font-bold text-[#151a20] shadow">
        ⇆
      </div>
      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[8px] font-semibold text-white">Trước</span>
      <span className="absolute right-1.5 bottom-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[8px] font-semibold text-white">Sau</span>
    </div>
  );
}

const CLOUD_WORDS: { w: string; x: number; y: number; s: number; o: number }[] = [
  { w: "Điện ảnh", x: 30, y: 20, s: 13, o: 1 },
  { w: "Phim nhựa", x: 68, y: 14, s: 10, o: 0.75 },
  { w: "Cưới", x: 14, y: 42, s: 11, o: 0.85 },
  { w: "Du lịch", x: 50, y: 40, s: 14, o: 1 },
  { w: "Neon", x: 82, y: 38, s: 11, o: 0.8 },
  { w: "Vintage", x: 24, y: 64, s: 10, o: 0.6 },
  { w: "Đen trắng", x: 62, y: 62, s: 11, o: 0.85 },
  { w: "Hoàng hôn", x: 40, y: 84, s: 10, o: 0.7 },
  { w: "Pastel", x: 80, y: 82, s: 9, o: 0.5 },
  { w: "Cổ điển", x: 12, y: 86, s: 9, o: 0.45 }
];

function CloudArt() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.55),rgba(30,27,75,0.3)_45%,transparent_75%)]">
      {CLOUD_WORDS.map((c) => (
        <span
          key={c.w}
          className="absolute -translate-x-1/2 -translate-y-1/2 font-medium whitespace-nowrap text-white"
          style={{ left: `${c.x}%`, top: `${c.y}%`, fontSize: c.s, opacity: c.o }}
        >
          {c.w}
        </span>
      ))}
    </div>
  );
}

function BoardArt() {
  return (
    <div className={`${panel} w-[84%] p-2.5`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-white">Phim cưới Đà Lạt</span>
        <Bookmark className="size-3.5 fill-(--sh-pink) text-(--sh-pink)" />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1">
        {[1040, 1044, 1047].map((id) => (
          <img key={id} src={picsumId(id, 120, 120)} alt="" width={120} height={120} loading="lazy" className="aspect-square w-full rounded-[4px] object-cover" />
        ))}
      </div>
      <p className="mt-1.5 text-[9px] text-white/60">12 LUT · cập nhật hôm nay</p>
    </div>
  );
}

function VideoArt() {
  return (
    <div className="relative h-[78%] w-[86%] overflow-hidden rounded-[8px] shadow-lg">
      <img src={picsumId(1043, 360, 270)} alt="" width={360} height={270} loading="lazy" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow">
        <Play className="ml-0.5 size-4 fill-[#151a20] text-[#151a20]" />
      </div>
      <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5 text-[8px] font-semibold text-white">
        <span>0:12</span>
        <div className="relative h-1 flex-1 rounded-full bg-white/30">
          <div className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-(--sh-pink)" />
        </div>
        <span>0:30</span>
      </div>
    </div>
  );
}

function CubeArt() {
  return (
    <div className="flex w-[84%] flex-col items-center gap-2">
      <div className={`${panel} flex w-full items-center gap-2 p-2.5`}>
        <span className="grid size-8 shrink-0 place-items-center rounded-[6px] bg-(--sh-primary)/20">
          <FileCode2 className="size-4 text-(--sh-pink)" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold text-white">hoang-hon.cube</p>
          <p className="text-[9px] text-white/55">33 × 33 × 33 · 1,2 MB</p>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-1">
        {["Resolve", "Premiere", "Final Cut", "CapCut"].map((s) => (
          <span key={s} className="rounded-full border border-white/15 px-1.5 py-0.5 text-[9px] text-white/75">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

const ARTS: Record<FeatureArtKind, () => React.JSX.Element> = {
  chat: ChatArt,
  shield: ShieldArt,
  filters: FiltersArt,
  compare: CompareArt,
  cloud: CloudArt,
  board: BoardArt,
  video: VideoArt,
  cube: CubeArt
};

export function FeatureArt({ kind }: { kind: FeatureArtKind }) {
  const Art = ARTS[kind];
  return (
    <div
      aria-hidden="true"
      className="relative flex aspect-[296/300] items-center justify-center overflow-hidden bg-[radial-gradient(120%_90%_at_50%_0%,#2f2a44_0%,#1f2129_75%)]"
    >
      {/* Phóng lớn cho tranh chiếm gần hết khung như bản tham chiếu */}
      <div className="flex size-full scale-[1.22] items-center justify-center">
        <Art />
      </div>
    </div>
  );
}
