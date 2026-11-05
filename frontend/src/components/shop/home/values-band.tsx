import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ShopButton } from "@/components/shop/ui/shop-button";

/** Cụm từ được tô nền nhạt, như vừa bôi đen trong trình soạn thảo. */
function Mark({ children }: { children: React.ReactNode }) {
  return <span className="whitespace-nowrap">{children}</span>;
}

export function ValuesBand() {
  return (
    <section
      aria-labelledby="values-title"
      className="bg-(--sh-band-pink) px-4 pt-16 pb-16 text-center text-[#151a20] md:px-8 md:pt-36 md:pb-28"
    >
      <div className="mx-auto max-w-4xl">
        <h2
          id="values-title"
          className="font-display text-3xl font-bold text-[#151a20] md:text-[52px]"
        >
          Màu thật, từ người chỉnh màu thật
        </h2>
        <p className="mx-auto mt-5 max-w-6xl font-['Chivo_Mono',ui-monospace,monospace] text-base leading-relaxed tracking-[-0.06em] text-[#80274f] md:text-[24px] md:leading-[1.6]">
          Chúng tôi đề cao <Mark>bàn tay con người</Mark> trong thời đại tự động hoá.
          <br className="hidden md:block" /> Mỗi LUT trên DownBeat do <Mark>colorist thật</Mark> tạo ra, với{" "}
          <Mark>mức giá công bằng</Mark>.
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <ShopButton
            asChild
            variant="secondary"
            className="h-12 rounded-[6px] border-0 bg-white px-6 text-lg font-semibold text-[#151a20] hover:bg-white/85"
          >
            <Link to="/luts">Khám phá kho LUT</Link>
          </ShopButton>
          <ShopButton
            asChild
            variant="secondary"
            className="h-12 gap-2 rounded-[6px] border-0 bg-white px-6 text-lg font-semibold text-[#151a20] hover:bg-white/85"
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
