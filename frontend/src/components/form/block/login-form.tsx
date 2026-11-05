"use client";

import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { useAppForm } from "@/components/form/hooks";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { useMutation } from "@tanstack/react-query";
import { createLoginMutationOptions } from "@/lib/tanstack/options/auth";
import type { LoginApiRequest } from "@/lib/types/auth";
import { useAuthStore } from "@/lib/stores/auth";

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Vui lòng nhập email hoặc số điện thoại")
    .refine(
      (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || /^[0-9]{8,15}$/.test(v),
      "Email hoặc số điện thoại không hợp lệ"
    ),
  // Đăng nhập chỉ cần có mật khẩu: tài khoản cũ có thể đặt mật khẩu trước khi có quy tắc 8 ký tự
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
  rememberMe: z.boolean().optional()
});

const isEmail = (v: string) => v.includes("@");

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const navigate = useNavigate();
  const set = useAuthStore((s) => s.set);
  const mutation = useMutation({
    ...createLoginMutationOptions(),
    onSuccess: (data) => {
      set({
        accessToken: data.token,
        refreshToken: data.refreshToken,
        userId: data.userId,
        remember: form.state.values.rememberMe !== false
      });
      form.reset();
      navigate({ to: "/admin" });
    }
  });
  const form = useAppForm({
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: true
    } satisfies LoginFormData as LoginFormData,
    validators: {
      onSubmit: loginSchema
    },
    onSubmit: async ({ value }) => {
      const payload: LoginApiRequest = isEmail(value.identifier)
        ? { email: value.identifier, plainPassword: value.password }
        : { phone: value.identifier, plainPassword: value.password };

      mutation.mutate(payload);
    }
  });

  return (
    <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-24">
      <div className="flex flex-col space-y-8">
        <h4 className="text-2xl font-bold tracking-tight md:text-3xl">Đăng nhập</h4>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <FieldGroup className="gap-6">
            {/* Email Field */}
            <form.AppField name="identifier">
              {(field) => (
                <field.Input
                  label="Email hoặc số điện thoại*"
                  placeholder="vd: example@gmail.com hoặc 0987654321"
                  description=""
                />
              )}
            </form.AppField>

            {/* Password Field */}
            <form.AppField name="password">
              {(field) => <field.Password label="Mật khẩu*" description="" />}
            </form.AppField>

            {/* Remember Me Row */}
            <div className="flex items-center">
              <form.AppField name="rememberMe">
                {(field) => (
                  <div className="flex items-center space-x-2">
                    <field.Checkbox label="Ghi nhớ đăng nhập" />
                  </div>
                )}
              </form.AppField>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full px-12 font-bold tracking-widest uppercase md:w-fit"
              disabled={form.state.isSubmitting}
            >
              {form.state.isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </FieldGroup>
        </form>
      </div>

      {/* Right Column: CTA */}
      <div className="flex flex-col space-y-6 border-t pt-12 md:border-t-0 md:border-l md:pt-0 md:pl-24">
        <h4 className="text-2xl font-bold tracking-tight md:text-3xl">Chưa có tài khoản?</h4>
        <p className="text-muted-foreground leading-relaxed">
          Hệ thống không hỗ trợ tự đăng ký. Quản trị viên sẽ phân quyền và cấp tài khoản cho bạn.
        </p>
      </div>
    </div>
  );
}
