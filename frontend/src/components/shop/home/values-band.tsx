import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ShopButton } from "@/components/shop/ui/shop-button";

export function ValuesBand() {
  return (
    <section
      aria-labelledby="values-title"
      className="bg-(--sh-band-pink) px-4 py-16 text-center text-[#151a20] md:px-8 md:py-24"
    >
      <div className="mx-auto max-w-4xl">
        <h2
          id="values-title"
          className="font-display text-2xl font-bold tracking-tight text-[#151a20] md:text-4xl"
        >
          Màu thật, từ người chỉnh màu thật
        </h2>
        <p className="mx-auto mt-6 max-w-2xl font-mono text-sm leading-relaxed text-[#151a20] md:text-base">
          Chúng tôi đề cao{" "}
          <span className="rounded-[4px] bg-white px-2 py-0.5 text-[#151a20] shadow-sm">
            bàn tay con người
          </span>{" "}
          trong thời đại tự động hoá. Mỗi LUT trên DownBeat do{" "}
          <span className="rounded-[4px] bg-white px-2 py-0.5 text-[#151a20] shadow-sm">
            colorist thật
          </span>{" "}
          tạo ra, với{" "}
          <span className="rounded-[4px] bg-white px-2 py-0.5 text-[#151a20] shadow-sm">
            mức giá công bằng
          </span>
          .
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <ShopButton
            asChild
            variant="secondary"
            className="border-0 bg-white font-semibold text-[#151a20] shadow-sm hover:bg-white/90"
          >
            <Link to="/luts">Khám phá kho LUT</Link>
          </ShopButton>
          <ShopButton
            asChild
            variant="secondary"
            className="gap-2 border-0 bg-white font-semibold text-[#151a20] shadow-sm hover:bg-white/90"
          >
            <Link to="/pricing">
              Xem bảng giá <ArrowRight className="size-4" />
            </Link>
          </ShopButton>
        </div>
      </div>
    </section>
  );
}
