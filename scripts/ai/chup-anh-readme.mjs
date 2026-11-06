// Chụp ảnh giao diện cho README.md → docs/img/readme/*.png
//   node scripts/ai/chup-anh-readme.mjs
// Cần: frontend dev đang chạy :4200 (cd frontend && pnpm dev). Ảnh trang quản trị cần thêm backend :9500;
// backend tắt thì bỏ qua hai ảnh đó. Đổi địa chỉ: README_BASE_URL.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const { chromium } = createRequire(path.join(ROOT, "frontend/package.json"))("@playwright/test");
const BASE = process.env.README_BASE_URL ?? "http://localhost:4200";
const OUT = path.join(ROOT, "docs/img/readme");
mkdirSync(OUT, { recursive: true });

const PRO_USER = { id: "u-pro", name: "Khách Pro", email: "pro@downbeat.local", plan: "pro", planExpiresAt: "2027-11-05" };
const FREE_USER = { id: "u-free", name: "Khách Miễn Phí", email: "free@downbeat.local", plan: "free", planExpiresAt: null };
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

const browser = await chromium.launch();

/** Trang mới với trạng thái sạch: theme, tài khoản cửa hàng (dữ liệu giả) đặt trước khi app chạy. */
async function open(urlPath, { theme = "light", user = null, viewport = DESKTOP, ready = "#shop-main" } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: viewport === MOBILE ? 2 : 1, locale: "vi-VN" });
  await ctx.addInitScript(
    ([theme, session]) => {
      localStorage.setItem("downbeat-ui-theme", theme);
      if (session) localStorage.setItem("downbeat-shop-session", session);
    },
    [theme, user ? JSON.stringify({ state: { user }, version: 0 }) : null]
  );
  const page = await ctx.newPage();
  await page.goto(BASE + urlPath);
  await page.locator(ready).first().waitFor();
  await settle(page);
  return page;
}

/** Chờ ảnh tải xong + animation kết thúc để ảnh chụp không bị mờ / dở dang. */
async function settle(page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    // Bỏ qua ảnh lazy ngoài khung nhìn: chưa tải thì decode() chờ mãi
    const inView = (img) => {
      const r = img.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight;
    };
    await Promise.all(
      [...document.images].map((img) =>
        img.complete || (img.loading === "lazy" && !inView(img)) ? null : img.decode().catch(() => null)
      )
    );
    await Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished));
  });
  await page.waitForTimeout(300);
}

// Ẩn nút devtools của TanStack Query và toast khi chụp
const HIDE_CSS = `.tsqd-parent-container, button[aria-label*="query devtools" i], [data-sonner-toaster] { display: none !important; }`;

/** JPEG thay PNG: trang toàn ảnh chụp nên PNG ~1MB/ảnh, JPEG nhẹ hơn nhiều mà vẫn rõ. */
async function shot(page, name, opts = {}) {
  await page.screenshot({ path: path.join(OUT, `${name}.jpg`), type: "jpeg", quality: 85, style: HIDE_CSS, ...opts });
  console.log("đã chụp", name);
}

const done = async (page) => page.context().close();
const dialog = (page) => page.getByRole("dialog");

// 0. Trang chủ (giao diện tối): đầu trang, băng tính năng. README_ONLY=trang-chu thì chỉ chụp phần này.
let page = await open("/", { theme: "dark", ready: "#hero-title" });
await shot(page, "00-trang-chu");
await page.locator("section[aria-labelledby=features-title]").evaluate((el) => el.scrollIntoView({ block: "start" }));
await page.waitForTimeout(600);
await settle(page);
await shot(page, "00-trang-chu-tinh-nang");
await done(page);
if (process.env.README_ONLY === "trang-chu") {
  await browser.close();
  process.exit(0);
}

// 1. Kho LUT (sáng / tối)
page = await open("/luts", { ready: 'ul[aria-label="Danh sách LUT"]' });
await shot(page, "01-kho-lut");
await done(page);

page = await open("/luts", { theme: "dark", ready: 'ul[aria-label="Danh sách LUT"]' });
await shot(page, "02-kho-lut-toi");
await done(page);

// 2. Gợi ý tìm kiếm
page = await open("/luts", { ready: 'ul[aria-label="Danh sách LUT"]' });
await page.getByRole("searchbox").first().fill("điện");
await page.waitForTimeout(600);
await settle(page);
await shot(page, "03-tim-kiem");
await done(page);

// 3. Chi tiết LUT: so sánh trước/sau, LUT liên quan
page = await open("/luts/xanh-dien-anh");
await shot(page, "04-chi-tiet-lut");
await done(page);

// 4. Chi tiết LUT ★ xem trước bằng video
page = await open("/luts/neo-tokyo");
await shot(page, "05-chi-tiet-video");
await done(page);

// 5. Trang danh mục
page = await open("/luts/danh-muc/dien-anh", { ready: 'ul[aria-label^="Danh sách LUT"]' });
await shot(page, "06-danh-muc");
await done(page);

// 6. Bảng giá
page = await open("/pricing");
await shot(page, "07-bang-gia");
await done(page);

// 7. Đăng ký / đăng nhập (hộp thoại)
page = await open("/luts", { ready: 'ul[aria-label="Danh sách LUT"]' });
await page.getByRole("button", { name: "Đăng ký" }).first().click();
await dialog(page).waitFor();
await settle(page);
await shot(page, "08-dang-ky");
await done(page);

page = await open("/luts", { ready: 'ul[aria-label="Danh sách LUT"]' });
await page.getByRole("button", { name: "Đăng nhập" }).first().click();
await dialog(page).waitFor();
await settle(page);
await shot(page, "09-dang-nhap");
await done(page);

// 8. LUT ★ với tài khoản miễn phí → mời nâng cấp
page = await open("/luts/kodak-400", { user: FREE_USER });
await page.getByRole("button", { name: "Tải LUT Premium" }).click();
await dialog(page).waitFor();
await settle(page);
await shot(page, "10-nang-cap");
await done(page);

// 9. Thanh toán gói Pro (payOS, bản demo)
page = await open("/pricing", { user: FREE_USER });
await page.getByRole("button", { name: "Chọn gói Pro" }).click();
await dialog(page).waitFor();
await settle(page);
await shot(page, "11-thanh-toan");
await done(page);

// 10. Menu tài khoản gói Pro
page = await open("/luts", { user: PRO_USER, ready: 'ul[aria-label="Danh sách LUT"]' });
await page.getByRole("button", { name: /Tài khoản/ }).click();
await page.getByRole("menu").waitFor();
await settle(page);
await shot(page, "12-tai-khoan");
await done(page);

// 11. Điện thoại
page = await open("/luts", { viewport: MOBILE, ready: 'ul[aria-label="Danh sách LUT"]' });
await shot(page, "13-dien-thoai");
await done(page);

page = await open("/luts/xanh-dien-anh", { viewport: MOBILE, theme: "dark" });
await shot(page, "14-dien-thoai-chi-tiet");
await done(page);

// 12. Quản trị (cần backend :9500)
const backendUp = await fetch("http://localhost:9500/api/v3/api-docs").then((r) => r.ok).catch(() => false);
if (backendUp) {
  page = await open("/login", { ready: "#identifier" });
  await shot(page, "15-admin-dang-nhap");
  await page.locator("#identifier").fill("admin@downbeat.local");
  await page.locator("#password").fill("Admin@123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.getByRole("heading", { name: /Xin chào/ }).waitFor();
  await settle(page);
  await shot(page, "16-admin");
  await done(page);
} else {
  console.log("backend :9500 chưa chạy — bỏ qua ảnh trang quản trị");
}

await browser.close();
