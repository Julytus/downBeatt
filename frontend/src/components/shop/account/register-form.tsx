import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { ShopCheckbox, ShopField } from "@/components/shop/ui/shop-field";
import { apiErrorOf } from "@/lib/axios/error";
import { useShopSession } from "@/lib/stores/shop-session";
import { registerMutationOptions } from "@/lib/tanstack/options/account";
import type { ShopUserDTO } from "@/lib/types/account";
import { ErrorResponseWarper } from "@/lib/types/common";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập họ tên").max(100, "Họ tên tối đa 100 ký tự"),
  email: z.string().trim().min(1, "Vui lòng nhập email").email("Email không hợp lệ").max(255),
  password: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .max(72, "Mật khẩu tối đa 72 ký tự")
    .regex(/[A-Za-z]/, "Mật khẩu cần có chữ cái")
    .regex(/[0-9]/, "Mật khẩu cần có chữ số"),
  terms: z.literal("on", { error: "Bạn cần đồng ý điều khoản để tiếp tục" })
});

type Field = keyof z.infer<typeof registerSchema>;
type Errors = Partial<Record<Field, string>>;

interface RegisterFormProps {
  onSuccess: (user: ShopUserDTO) => void;
  onSwitchToLogin: (email?: string) => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const setUser = useShopSession((s) => s.setUser);
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const mutation = useMutation({
    ...registerMutationOptions,
    onSuccess: (user) => {
      setUser(user);
      onSuccess(user);
    }
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = registerSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
        if (!parsed.success) {
          const fe = z.flattenError(parsed.error).fieldErrors as Partial<Record<Field, string[]>>;
          setErrors({
            name: fe.name?.[0],
            email: fe.email?.[0],
            password: fe.password?.[0],
            terms: fe.terms?.[0]
          });
          return;
        }
        setErrors({});
        const { name, email, password } = parsed.data;
        setSubmittedEmail(email);
        mutation.mutate({ name, email, password });
      }}
    >
      <ShopField label="Họ tên" name="name" autoComplete="name" autoFocus error={errors.name} />
      <ShopField label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
      <ShopField
        label="Mật khẩu"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Tối thiểu 8 ký tự, có chữ và số"
        error={errors.password}
      />
      <ShopCheckbox label="Hiện mật khẩu" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
      <ShopCheckbox
        name="terms"
        error={errors.terms}
        label={
          <>
            Tôi đồng ý với{" "}
            <a href="#" className="font-semibold text-(--sh-fg) underline underline-offset-4">
              Điều khoản sử dụng
            </a>{" "}
            và{" "}
            <a href="#" className="font-semibold text-(--sh-fg) underline underline-offset-4">
              Chính sách bảo mật
            </a>
          </>
        }
      />

      {mutation.isError && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-[8px] bg-(--sh-active-bg) px-3 py-2 text-sm font-medium text-(--sh-active-fg)"
        >
          <span>{ErrorResponseWarper(mutation.error)}</span>
          {apiErrorOf(mutation.error).errorCode === "EMAIL_EXISTS" && (
            <button
              type="button"
              onClick={() => onSwitchToLogin(submittedEmail)}
              className="self-start text-xs font-semibold text-(--sh-primary) underline underline-offset-4 hover:opacity-90"
            >
              Đăng nhập bằng email này
            </button>
          )}
        </div>
      )}

      <ShopButton type="submit" variant="primary" className="mt-1 w-full" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        {mutation.isPending ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
      </ShopButton>

      <p className="text-sm text-(--sh-muted)">
        Đã có tài khoản?{" "}
        <button
          type="button"
          onClick={() => onSwitchToLogin()}
          className="font-semibold text-(--sh-fg) underline underline-offset-4"
        >
          Đăng nhập
        </button>
      </p>
    </form>
  );
}
