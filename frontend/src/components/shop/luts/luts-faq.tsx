import { BookOpen, ChevronDown } from "lucide-react";

const FAQ = [
  {
    q: "LUT là gì?",
    a: "LUT (Look-Up Table) là bảng tra màu: mỗi màu của video gốc được đổi sang một màu mới theo công thức có sẵn. Áp một LUT là có ngay tông màu của người chỉnh màu chuyên nghiệp chỉ với một cú kéo thả."
  },
  {
    q: "Dùng LUT như thế nào?",
    a: "Tải file .cube về máy, mở phần mềm dựng phim rồi nạp LUT vào hiệu ứng màu: Lumetri Color (Premiere Pro), node Color (DaVinci Resolve), Custom LUT (Final Cut Pro) hoặc mục Điều chỉnh (CapCut bản máy tính). Sau đó chỉnh cường độ cho hợp cảnh quay."
  },
  {
    q: "LUT có dùng được cho mọi cảnh quay không?",
    a: "LUT cho kết quả đẹp nhất khi cảnh quay đã cân bằng trắng và phơi sáng đúng. Với video quay Log, hãy chuyển về Rec.709 trước rồi mới áp LUT tạo màu."
  },
  {
    q: "LUT khác preset chỉnh màu thế nào?",
    a: "Preset lưu các thông số chỉnh (độ sáng, tương phản…) của một phần mềm cụ thể. LUT là bảng màu độc lập, dùng được ở hầu hết phần mềm dựng phim và chỉnh ảnh."
  },
  {
    q: "LUT miễn phí có dùng cho video thương mại được không?",
    a: "LUT miễn phí dùng cho video cá nhân trên kênh của bạn. Làm video cho khách hàng hay chạy quảng cáo cần gói Pro hoặc Studio; xem chi tiết ở trang Bảng giá."
  },
  {
    q: "LUT có dấu ★ là gì?",
    a: "Đó là LUT Premium, chỉ thành viên gói Pro hoặc Studio mới tải được. Tài khoản miễn phí vẫn xem trước được LUT Premium bằng cách rê chuột lên ảnh."
  }
];

/** Câu hỏi thường gặp (dùng <details> nên mở / đóng được bằng bàn phím, không cần JS) */
export function LutsFaq() {
  return (
    <section id="huong-dan" aria-labelledby="luts-faq-title" className="mt-16 scroll-mt-20">
      <h2 id="luts-faq-title" className="text-lg font-bold">
        Câu hỏi thường gặp
      </h2>
      <div className="mt-4 divide-y divide-(--sh-border) border-y border-(--sh-border)">
        {FAQ.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <p className="pb-4 text-sm leading-6 text-(--sh-muted)">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4 rounded-[12px] bg-(--sh-surface) p-5">
        <BookOpen className="size-6 shrink-0 text-(--sh-pink)" aria-hidden />
        <div>
          <p className="font-semibold">Mới dùng LUT?</p>
          <p className="text-sm text-(--sh-muted)">
            Mở câu hỏi “Dùng LUT như thế nào?” ở trên để xem từng bước áp LUT vào video của bạn.
          </p>
        </div>
      </div>
    </section>
  );
}
