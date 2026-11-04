import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { useAppForm } from "@/components/form/hooks";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  createForgotPasswordMutationOptions,
  createResetPasswordMutationOptions
} from "@/lib/tanstack/options/auth";

const emailSchema = z.object({
  email: z.email("Vui lòng nhập địa chỉ email hợp lệ")
});

// Khớp PasswordPolicy của backend: 8–72 ký tự
const resetSchema = z
  .object({
    otp: z.string().trim().regex(/^[0-9]{6}$/, "Mã OTP gồm 6 chữ số"),
    newPassword: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .max(72, "Mật khẩu tối đa 72 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu")
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp"
  });

/**
 * Quên mật khẩu 2 bước: (1) nhập email → backend gửi OTP; (2) nhập OTP + mật khẩu mới.
 * Backend luôn trả cùng 1 thông báo ở bước 1 nên không biết email có tồn tại hay không.
 */
export function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState<string | null>(null);

  const sendOtp = useMutation({
    ...createForgotPasswordMutationOptions(),
    onSuccess: (message, variables) => {
      toast.success(message);
      setEmail(variables.email);
    }
  });

  const reset = useMutation({
    ...createResetPasswordMutationOptions(),
    onSuccess: () => navigate({ to: "/login" })
  });

  const emailForm = useAppForm({
    defaultValues: { email: "" },
    validators: { onSubmit: emailSchema },
    onSubmit: ({ value }) => sendOtp.mutate({ email: value.email.trim() })
  });

  const resetForm = useAppForm({
    defaultValues: { otp: "", newPassword: "", confirmPassword: "" },
    validators: { onSubmit: resetSchema },
    onSubmit: ({ value }) =>
      email && reset.mutate({ email, otp: value.otp.trim(), newPassword: value.newPassword })
  });

  return (
    <div className="mx-auto flex max-w-md flex-col space-y-8">
      <div className="space-y-2">
        <h4 className="text-2xl font-bold tracking-tight md:text-3xl">Quên mật khẩu</h4>
        <p className="text-muted-foreground text-sm">
          {email
            ? `Nhập mã OTP đã gửi tới ${email} (hiệu lực 5 phút) và mật khẩu mới.`
            : "Nhập email đăng ký, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu."}
        </p>
      </div>

      {!email ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            emailForm.handleSubmit();
          }}
        >
          <FieldGroup className="gap-6">
            <emailForm.AppField name="email">
              {(field) => <field.Input label="Email*" placeholder="vd: example@gmail.com" />}
            </emailForm.AppField>
            <Button type="submit" size="lg" disabled={sendOtp.isPending}>
              {sendOtp.isPending ? "Đang gửi..." : "Gửi mã OTP"}
            </Button>
          </FieldGroup>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            resetForm.handleSubmit();
          }}
        >
          <FieldGroup className="gap-6">
            <resetForm.AppField name="otp">
              {(field) => <field.Input label="Mã OTP*" placeholder="6 chữ số" />}
            </resetForm.AppField>
            <resetForm.AppField name="newPassword">
              {(field) => <field.Password label="Mật khẩu mới*" description="" />}
            </resetForm.AppField>
            <resetForm.AppField name="confirmPassword">
              {(field) => <field.Password label="Xác nhận mật khẩu*" description="" />}
            </resetForm.AppField>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" size="lg" disabled={reset.isPending}>
                {reset.isPending ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={sendOtp.isPending}
                onClick={() => sendOtp.mutate({ email })}
              >
                Gửi lại mã
              </Button>
            </div>
          </FieldGroup>
        </form>
      )}

      <Link
        to="/login"
        className="text-primary text-sm font-medium underline-offset-4 hover:underline"
      >
        ← Quay lại đăng nhập
      </Link>
    </div>
  );
}
