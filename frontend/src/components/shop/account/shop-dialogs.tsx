import { X } from "lucide-react";
import { useLutDownload } from "@/hooks/use-lut-download";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MOCK_PLANS } from "@/lib/mock/data/plans";
import { useShopDialog, type ShopDialog } from "@/lib/stores/shop-dialog";
import { CheckoutPanel } from "./checkout-panel";
import { LoginForm } from "./login-form";
import { LutMiniCard } from "./lut-mini-card";
import { RegisterForm } from "./register-form";
import { UpgradePanel } from "./upgrade-panel";

const planName = (code: string) => MOCK_PLANS.find((p) => p.code === code)?.name ?? code;

/** Tiêu đề + mô tả theo từng loại hộp thoại (mô tả nối với hộp thoại qua aria-describedby) */
function headingOf(dialog: ShopDialog): { title: string; description: string } {
  switch (dialog.type) {
    case "login":
      return {
        title: "Đăng nhập",
        description: dialog.lut ? "Đăng nhập để tải LUT này." : "Chào mừng bạn quay lại DownBeat."
      };
    case "register":
      if (dialog.lut)
        return {
          title: "Tạo tài khoản miễn phí để tải",
          description: "Miễn phí cho video cá nhân. Nâng cấp bất cứ lúc nào để dùng cho khách hàng."
        };
      if (dialog.plan)
        return {
          title: `Tạo tài khoản để mua gói ${planName(dialog.plan)}`,
          description: "Chỉ mất vài giây, sau đó bạn chuyển thẳng sang bước thanh toán."
        };
      return { title: "Tạo tài khoản DownBeat", description: "Tải LUT miễn phí và lưu bộ sưu tập của bạn." };
    case "upgrade":
      return {
        title: "Nâng cấp để tải LUT Premium",
        description: "LUT có dấu ★ dành cho thành viên gói Pro và Studio."
      };
    case "checkout":
      return { title: `Mua gói ${planName(dialog.plan)}`, description: "Kiểm tra lại đơn hàng trước khi thanh toán." };
  }
}

/** Mọi hộp thoại của cửa hàng, render một lần ở layout. Mở bằng `useShopDialog().open(...)`. */
export function ShopDialogs() {
  const dialog = useShopDialog((s) => s.dialog);
  const open = useShopDialog((s) => s.open);
  const close = useShopDialog((s) => s.close);
  const { download } = useLutDownload();

  const afterAuth = () => {
    if (!dialog) return;
    if ((dialog.type === "login" || dialog.type === "register") && dialog.plan) {
      open({ type: "checkout", plan: dialog.plan, cycle: "year" });
      return;
    }
    close();
    if ((dialog.type === "login" || dialog.type === "register") && dialog.lut) {
      // Tiếp tục tải LUT người dùng vừa bấm (LUT Premium + gói Miễn phí sẽ mở hộp thoại nâng cấp)
      download(dialog.lut);
    }
  };

  const heading = dialog ? headingOf(dialog) : null;
  const lut = dialog && "lut" in dialog ? dialog.lut : undefined;

  return (
    <Dialog open={!!dialog} onOpenChange={(o) => !o && close()}>
      {dialog && heading && (
        <DialogContent
          key={dialog.type}
          showCloseButton={false}
          className="shop max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-[12px] border-(--sh-border) bg-(--sh-elevated) p-6 text-(--sh-fg) sm:max-w-[420px] sm:p-8"
        >
          <DialogClose asChild>
            <ShopButton variant="ghost" size="icon-sm" aria-label="Đóng" className="absolute top-4 right-4">
              <X />
            </ShopButton>
          </DialogClose>

          {lut && (
            <div className="mb-5 pr-8">
              <LutMiniCard lut={lut} />
            </div>
          )}
          <DialogTitle className="font-display pr-8 text-2xl leading-tight font-bold">{heading.title}</DialogTitle>
          <DialogDescription className="mt-2 mb-6 text-sm text-(--sh-muted)">{heading.description}</DialogDescription>

          {dialog.type === "login" && (
            <LoginForm
              defaultEmail={dialog.email}
              onSuccess={afterAuth}
              onSwitchToRegister={() => open({ type: "register", lut: dialog.lut, plan: dialog.plan })}
            />
          )}
          {dialog.type === "register" && (
            <RegisterForm
              onSuccess={afterAuth}
              onSwitchToLogin={(email) => open({ type: "login", lut: dialog.lut, plan: dialog.plan, email })}
            />
          )}
          {dialog.type === "upgrade" && <UpgradePanel onClose={close} />}
          {dialog.type === "checkout" && <CheckoutPanel plan={dialog.plan} cycle={dialog.cycle} onDone={close} />}
        </DialogContent>
      )}
    </Dialog>
  );
}
