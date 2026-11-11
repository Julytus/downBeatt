import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useLutDownload } from "@/hooks/use-lut-download";
import { SaveToCollectionPanel } from "@/components/shop/collection/save-to-collection-panel";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useShopDialog, type ShopDialog } from "@/lib/stores/shop-dialog";
import { plansQueryOptions } from "@/lib/tanstack/options/billing";
import type { LutDTO } from "@/lib/types/lut";
import { cn } from "@/lib/utils";
import { CheckoutPanel } from "./checkout-panel";
import { DownloadDonePanel } from "./download-done-panel";
import { LoginForm } from "./login-form";
import { LutMiniCard } from "./lut-mini-card";
import { PreferencePanel } from "./preference-panel";
import { RegisterForm } from "./register-form";
import { UpgradePanel } from "./upgrade-panel";

/** Tiêu đề + mô tả theo từng loại hộp thoại (mô tả nối với hộp thoại qua aria-describedby) */
function headingOf(
  dialog: ShopDialog,
  getPlanName: (code: string) => string
): { title: string; description: React.ReactNode } {
  switch (dialog.type) {
    case "login":
      return {
        title: "Đăng nhập",
        description:
          dialog.then === "collection"
            ? "Đăng nhập để lưu LUT vào bộ sưu tập."
            : dialog.lut
              ? "Đăng nhập để tải LUT này."
              : "Chào mừng bạn quay lại DownBeat."
      };
    case "register":
      if (dialog.then === "collection")
        return {
          title: "Tạo tài khoản để lưu bộ sưu tập",
          description: "Miễn phí, lưu được 3 bộ sưu tập. Nâng cấp Pro để lưu không giới hạn."
        };
      if (dialog.lut)
        return {
          title: "Tạo tài khoản miễn phí để tải",
          description: "Miễn phí cho video cá nhân. Nâng cấp bất cứ lúc nào để dùng cho khách hàng."
        };
      if (dialog.plan)
        return {
          title: `Tạo tài khoản để mua gói ${getPlanName(dialog.plan)}`,
          description: "Chỉ mất vài giây, sau đó bạn chuyển thẳng sang bước thanh toán."
        };
      return { title: "Tạo tài khoản DownBeat", description: "Tải LUT miễn phí và lưu bộ sưu tập của bạn." };
    case "collection":
      return {
        title: "Lưu vào bộ sưu tập",
        description: null
      };
    case "upgrade":
      return {
        title: "Nâng cấp để tải LUT Premium",
        description: "LUT có dấu ★ dành cho thành viên gói Pro và Studio."
      };
    case "checkout":
      return {
        title: `Mua gói ${getPlanName(dialog.plan)}`,
        description: "Kiểm tra lại đơn hàng trước khi thanh toán."
      };
    case "downloaded":
      return {
        title: "Đã tải xong",
        description: (
          <>
            <strong className="font-semibold text-(--sh-fg)">{dialog.fileName}</strong> đã được lưu vào thư mục Tải xuống.
          </>
        )
      };
    case "preference":
      if (dialog.mode === "onboarding") {
        return {
          title: "Bạn thích phong cách màu nào?",
          description: (
            <>
              <span>Chọn 1 đến 5 phong cách, chúng tôi gợi ý LUT hợp gu.</span>
              {dialog.next?.then === "download" && (
                <span className="mt-1 block font-medium text-(--sh-pink)">
                  Xong bước này, “{dialog.next.lut.title}” sẽ được tải ngay.
                </span>
              )}
              {dialog.next?.then === "collection" && (
                <span className="mt-1 block font-medium text-(--sh-pink)">
                  Xong bước này, bạn chọn bộ sưu tập để lưu “{dialog.next.lut.title}”.
                </span>
              )}
            </>
          )
        };
      }
      return {
        title: "Sở thích màu",
        description: "Chọn 1 đến 5 phong cách, chúng tôi gợi ý LUT hợp gu."
      };
  }
}

/** Mọi hộp thoại của cửa hàng, render một lần ở layout. Mở bằng `useShopDialog().open(...)`. */
export function ShopDialogs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dialog = useShopDialog((s) => s.dialog);
  const open = useShopDialog((s) => s.open);
  const close = useShopDialog((s) => s.close);
  const { download } = useLutDownload();
  const { data: plans } = useQuery(plansQueryOptions);

  const planName = (code: string) =>
    plans?.find((p) => p.code === code)?.name ?? (code === "studio" ? "Studio" : "Pro");

  const continueAfterPreference = (
    mode: "onboarding" | "edit",
    next: { then: "download" | "collection"; lut: LutDTO } | undefined,
    saved: boolean
  ) => {
    if (saved) {
      if (mode === "onboarding") {
        if (!next) {
          close();
          if (pathname !== "/luts") {
            void navigate({ to: "/luts" });
          }
        } else if (next.then === "download") {
          close();
          download(next.lut);
        } else if (next.then === "collection") {
          open({ type: "collection", lut: next.lut });
        }
      } else {
        close();
      }
    } else {
      // Bỏ qua / Huỷ
      if (!next) {
        close();
      } else if (next.then === "download") {
        close();
        download(next.lut);
      } else if (next.then === "collection") {
        open({ type: "collection", lut: next.lut });
      }
    }
  };

  const afterAuth = () => {
    if (!dialog) return;
    if ((dialog.type === "login" || dialog.type === "register") && dialog.plan) {
      open({ type: "checkout", plan: dialog.plan, cycle: "year" });
      return;
    }
    if (dialog.type === "register") {
      let next: { then: "download" | "collection"; lut: LutDTO } | undefined;
      if (dialog.then === "collection" && dialog.lut) {
        next = { then: "collection", lut: dialog.lut };
      } else if (dialog.lut) {
        next = { then: "download", lut: dialog.lut };
      }
      open({ type: "preference", mode: "onboarding", next });
      return;
    }
    if (dialog.type === "login" && dialog.then === "collection" && dialog.lut) {
      open({ type: "collection", lut: dialog.lut });
      return;
    }
    close();
    if (dialog.type === "login" && dialog.lut) {
      download(dialog.lut);
    }
  };

  const heading = dialog ? headingOf(dialog, planName) : null;
  const lut = dialog && "lut" in dialog ? dialog.lut : undefined;

  return (
    <Dialog open={!!dialog} onOpenChange={(o) => !o && close()}>
      {dialog && heading && (
        <DialogContent
          key={dialog.type}
          showCloseButton={false}
          className={cn(
            "shop max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-[12px] border-(--sh-border) bg-(--sh-elevated) p-6 text-(--sh-fg) sm:p-8",
            dialog.type === "preference" ? "sm:max-w-[600px]" : "sm:max-w-[420px]"
          )}
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
          {dialog.type === "preference" && dialog.mode === "onboarding" && (
            <div className="mb-1 text-xs font-semibold text-(--sh-pink)">Bước 2 / 2</div>
          )}
          <DialogTitle className="font-display pr-8 text-2xl leading-tight font-bold">{heading.title}</DialogTitle>
          {heading.description && (
            <DialogDescription className="mt-2 mb-6 text-sm text-(--sh-muted)">
              {heading.description}
            </DialogDescription>
          )}

          {dialog.type === "login" && (
            <LoginForm
              defaultEmail={dialog.email}
              onSuccess={afterAuth}
              onSwitchToRegister={() =>
                open({ type: "register", lut: dialog.lut, plan: dialog.plan, then: dialog.then })
              }
            />
          )}
          {dialog.type === "register" && (
            <RegisterForm
              onSuccess={afterAuth}
              onSwitchToLogin={(email) =>
                open({ type: "login", lut: dialog.lut, plan: dialog.plan, email, then: dialog.then })
              }
            />
          )}
          {dialog.type === "collection" && <SaveToCollectionPanel lut={dialog.lut} onClose={close} />}
          {dialog.type === "upgrade" && <UpgradePanel lut={dialog.lut} onClose={close} />}
          {dialog.type === "checkout" && (
            <CheckoutPanel
              plan={dialog.plan}
              cycle={dialog.cycle}
              sourceLutId={dialog.sourceLutId}
              onDone={close}
            />
          )}
          {dialog.type === "downloaded" && (
            <DownloadDonePanel
              lut={dialog.lut}
              fileName={dialog.fileName}
              onClose={close}
            />
          )}
          {dialog.type === "preference" && (
            <PreferencePanel
              mode={dialog.mode}
              next={dialog.next}
              onDone={(saved) => continueAfterPreference(dialog.mode, dialog.next, saved)}
            />
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
