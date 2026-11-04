import type { PlanDTO } from "@/lib/types/account";

/** Bảng giá mẫu (VND). Khi có backend, lấy từ GET /api/plan/list. */
export const MOCK_PLANS: PlanDTO[] = [
  {
    code: "free",
    name: "Miễn phí",
    audience: "Cá nhân mới bắt đầu",
    monthlyPrice: 0,
    yearlyMonthlyPrice: 0,
    license: ["Video cá nhân trên kênh của bạn"],
    features: ["Tải không giới hạn LUT miễn phí", "File .cube cho mọi phần mềm", "So sánh ảnh trước / sau khi áp LUT"]
  },
  {
    code: "pro",
    name: "Pro",
    audience: "Nhà sáng tạo & freelancer",
    monthlyPrice: 99_000,
    yearlyMonthlyPrice: 79_000,
    highlight: true,
    license: ["Cá nhân & freelancer", "Dự án cho khách hàng", "Quảng cáo trên mạng xã hội"],
    features: ["Mọi LUT miễn phí", "Toàn bộ LUT Premium", "LUT mới mỗi tuần", "Bộ sưu tập không giới hạn"]
  },
  {
    code: "studio",
    name: "Studio",
    audience: "Studio, agency & đội nhóm",
    monthlyPrice: 249_000,
    yearlyMonthlyPrice: 199_000,
    license: ["Đội nhóm tới 5 thành viên", "Khách hàng doanh nghiệp", "Truyền hình & quảng cáo trả phí"],
    features: ["Mọi quyền lợi của Pro", "5 tài khoản thành viên", "Xuất hoá đơn VAT", "Hỗ trợ ưu tiên"]
  }
];

/** Bảng so sánh ở trang giá: mỗi dòng một quyền lợi, giá trị theo thứ tự free / pro / studio */
export const PLAN_COMPARISON: { group: string; rows: { label: string; values: (boolean | string)[] }[] }[] = [
  {
    group: "Kho LUT",
    rows: [
      { label: "LUT miễn phí", values: [true, true, true] },
      { label: "LUT Premium (dấu ★)", values: [false, true, true] },
      { label: "LUT mới mỗi tuần", values: [false, true, true] },
      { label: "Bộ sưu tập", values: ["3 bộ", "Không giới hạn", "Không giới hạn"] }
    ]
  },
  {
    group: "Giấy phép",
    rows: [
      { label: "Video cá nhân", values: [true, true, true] },
      { label: "Dự án cho khách hàng", values: [false, true, true] },
      { label: "Quảng cáo trả phí", values: [false, false, true] },
      { label: "Truyền hình, điện ảnh", values: [false, false, true] }
    ]
  },
  {
    group: "Tài khoản",
    rows: [
      { label: "Số thành viên", values: ["1", "1", "5"] },
      { label: "Hoá đơn VAT", values: [false, false, true] },
      { label: "Hỗ trợ", values: ["Email", "Email", "Ưu tiên"] }
    ]
  }
];
