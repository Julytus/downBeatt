import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { ShopCheckbox, ShopField } from "@/components/shop/ui/shop-field";
import { useShopSession } from "@/lib/stores/shop-session";
import { loginMutationOptions } from "@/lib/tanstack/options/account";
import type { ShopUserDTO } from "@/lib/types/account";
import { ErrorResponseWarper } from "@/lib/types/common";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu")
});

type Errors = Partial<Record<keyof z.infer<typeof loginSchema>, string>>;

interface LoginFormProps {
  defaultEmail?: string;
  onSuccess: (user: ShopUserDTO) => void;
  onSwitchToRegister: () => void;
}

export function LoginForm({ defaultEmail, onSuccess, onSwitchToRegister }: LoginFormProps) {
  const setUser = useShopSession((s) => s.setUser);
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultEmail) {
      passwordRef.current?.focus();
    }
  }, [defaultEmail]);

  const mutation = useMutation({
    ...loginMutationOptions,
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
        const data = Object.fromEntries(new FormData(e.currentTarget));
        const parsed = loginSchema.safeParse(data);
        if (!parsed.success) {
          const fieldErrors = z.flattenError(parsed.error).fieldErrors;
          setErrors({ email: fieldErrors.email?.[0], password: fieldErrors.password?.[0] });
          return;
        }
        setErrors({});
        mutation.mutate(parsed.data);
      }}
    >
      <ShopField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={defaultEmail}
        autoFocus={!defaultEmail}
        error={errors.email}
      />
      <ShopField
        ref={passwordRef}
        label="Mật khẩu"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        autoFocus={!!defaultEmail}
        error={errors.password}
      />
      <div className="flex items-center">
        <ShopCheckbox
          label="Hiện mật khẩu"
          checked={showPassword}
          onChange={(e) => setShowPassword(e.target.checked)}
        />
      </div>

      {mutation.isError && (
        <p role="alert" className="rounded-[8px] bg-(--sh-active-bg) px-3 py-2 text-sm font-medium text-(--sh-active-fg)">
          {ErrorResponseWarper(mutation.error)}
        </p>
      )}

      <ShopButton type="submit" variant="primary" className="mt-1 w-full" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        {mutation.isPending ? "Đang đăng nhập…" : "Đăng nhập"}
      </ShopButton>

      <p className="text-sm text-(--sh-muted)">
        Chưa có tài khoản?{" "}
        <button type="button" onClick={onSwitchToRegister} className="font-semibold text-(--sh-fg) underline underline-offset-4">
          Đăng ký
        </button>
      </p>

      {import.meta.env.DEV && (
        <p className="rounded-[8px] border border-dashed border-(--sh-border) p-2 text-xs text-(--sh-muted)">
          Tài khoản thử: <b>free@downbeat.local</b>, mật khẩu <b>Admin@123</b>
        </p>
      )}
    </form>
  );
}
