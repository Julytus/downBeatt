import { createFileRoute, redirect } from "@tanstack/react-router";

/** Trang chính là cửa hàng (kho LUT). Trang quản trị ở /admin. */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/luts" });
  }
});
