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
