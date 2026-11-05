import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/shop/home/home-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "DownBeat | Kho LUT chỉnh màu cho nhà sáng tạo"
      }
    ]
  }),
  component: HomePage
});
