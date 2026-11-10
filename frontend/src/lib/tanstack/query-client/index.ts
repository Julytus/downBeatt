import { ErrorResponseWarper, getServerErrorMessage } from "@/lib/types/common";
import { MutationCache, QueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      invalidatesQuery?: QueryKey[];
      successMessage?: string | ((data: unknown) => string);
      errorMessage?: string;
      silentError?: boolean | ((error: unknown) => boolean);
    };
  }
}

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (data, _variables, _context, mutation) => {
      const msg = mutation.meta?.successMessage;
      if (typeof msg === "function") {
        const text = msg(data);
        if (text) {
          toast.success(text);
        }
      } else if (msg) {
        toast.success(msg);
      }
    },

    onError: (err, _vars, _context, mutation) => {
      // Bỏ qua toast khi silentError = true hoặc trả về true (RT-12)
      const silent = mutation.meta?.silentError;
      if (typeof silent === "function" ? silent(err) : silent) return;

      // Ưu tiên message của backend (vd "Email đã tồn tại", "Mật khẩu phải có từ 8..."),
      // meta.errorMessage chỉ dùng khi lỗi không có body (mất mạng, timeout...)
      const message =
        getServerErrorMessage(err) ?? mutation.meta?.errorMessage ?? ErrorResponseWarper(err);
      toast.error(message);
    },

    onSettled: (_data, _error, _variables, _context, mutation) => {
      const keys = mutation.meta?.invalidatesQuery;
      if (!keys) return;

      const list = Array.isArray(keys) ? keys : [keys];

      list.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    }
  })
});
