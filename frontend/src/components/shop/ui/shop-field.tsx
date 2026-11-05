import { useId } from "react";
import { cn } from "@/lib/utils";

interface ShopFieldProps extends Omit<React.ComponentProps<"input">, "id"> {
  label: string;
  error?: string;
  /** Nội dung bên phải nhãn */
  labelAside?: React.ReactNode;
}

/** Ô nhập có nhãn + thông báo lỗi, nối với nhau bằng aria-describedby để trình đọc màn hình đọc lỗi. */
export function ShopField({ label, error, labelAside, className, ...props }: ShopFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        {labelAside}
      </div>
      <input
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "h-11 w-full rounded-[8px] border border-(--sh-input-border) bg-transparent px-3 text-sm text-(--sh-fg) transition-colors outline-none placeholder:text-(--sh-muted)",
          "focus-visible:border-(--sh-fg) focus-visible:ring-2 focus-visible:ring-(--sh-pink)/40",
          error && "border-(--sh-danger)"
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs font-medium text-(--sh-danger)">
          {error}
        </p>
      )}
    </div>
  );
}

/** Ô tích có nhãn (đồng ý điều khoản, hiện mật khẩu…) */
export function ShopCheckbox({
  label,
  error,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type" | "id"> & { label: React.ReactNode; error?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2 text-sm text-(--sh-muted)">
        <input
          id={id}
          type="checkbox"
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-4 shrink-0 accent-(--sh-primary)"
          {...props}
        />
        <span>{label}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-(--sh-danger)">
          {error}
        </p>
      )}
    </div>
  );
}
