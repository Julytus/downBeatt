import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Nút của khu cửa hàng. Bo góc ghi bằng px vì token `--radius` của dự án (1rem) dành cho trang quản trị.
 */
const shopButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-sm tracking-[0.04px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-(--sh-pink)/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-(--sh-primary) font-semibold text-white hover:bg-(--sh-primary-hover)",
        secondary: "bg-(--sh-surface) font-semibold text-(--sh-fg) hover:bg-(--sh-surface-hover)",
        outline: "border border-(--sh-border) text-(--sh-fg) hover:bg-(--sh-surface)",
        ghost: "text-(--sh-fg) hover:bg-(--sh-surface)",
        overlay: "text-white hover:bg-white/15"
      },
      size: {
        sm: "h-8 rounded-[8px] px-3",
        md: "h-10 rounded-[8px] px-3 sm:px-4",
        "icon-sm": "size-7 rounded-full [&_svg]:size-4",
        icon: "size-8 rounded-full [&_svg]:size-5",
        "icon-lg": "size-9 rounded-full [&_svg]:size-4",
        "icon-square": "size-10 rounded-[8px] [&_svg]:size-5"
      }
    },
    defaultVariants: { variant: "secondary", size: "md" }
  }
);

export interface ShopButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof shopButtonVariants> {
  asChild?: boolean;
}

export function ShopButton({ className, variant, size, asChild, type, ...props }: ShopButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      type={asChild ? undefined : (type ?? "button")}
      className={cn(shopButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
