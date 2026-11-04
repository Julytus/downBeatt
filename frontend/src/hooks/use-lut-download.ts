import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { ApiError } from "@/lib/mock/account";
import { useShopDialog } from "@/lib/stores/shop-dialog";
import { canDownloadPremium, useShopSession } from "@/lib/stores/shop-session";
import { lutDownloadMutationOptions } from "@/lib/tanstack/options/account";
import type { LutDTO } from "@/lib/types/lut";

/** Kích hoạt tải file từ URL (blob hoặc URL ký sẵn) mà không rời trang. */
function saveFile(url: string, fileName: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (url.startsWith("blob:")) setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Luồng bấm "Tải":
 * 1. Chưa đăng nhập → hộp thoại đăng ký (kèm thẻ LUT)
 * 2. LUT Premium + gói Miễn phí → hộp thoại nâng cấp
 * 3. Còn lại → xin link tải rồi lưu file .cube (toast nằm ở meta của mutation)
 */
export function useLutDownload() {
  const openDialog = useShopDialog((s) => s.open);

  const { mutate, isPending, variables } = useMutation({
    ...lutDownloadMutationOptions,
    onSuccess: ({ url, fileName }) => saveFile(url, fileName),
    onError: (err, { lut }) => {
      // Gói trong phiên đã cũ (vd hết hạn) mà server từ chối → mời nâng cấp
      if (err instanceof ApiError && err.errorCode === "PLAN_REQUIRED") openDialog({ type: "upgrade", lut });
    }
  });

  const download = useCallback(
    (lut: LutDTO) => {
      // Đọc user lúc bấm (không lấy theo lần render) để gọi được ngay sau khi vừa đăng nhập
      const user = useShopSession.getState().user;
      if (!user) return openDialog({ type: "register", lut });
      if (lut.premium && !canDownloadPremium(user)) return openDialog({ type: "upgrade", lut });
      mutate({ lut, user });
    },
    [openDialog, mutate]
  );

  return {
    download,
    /** id LUT đang xin link tải (để hiện spinner đúng nút) */
    pendingId: isPending ? variables?.lut.id : undefined
  };
}
