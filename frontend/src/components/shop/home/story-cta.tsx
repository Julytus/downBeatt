import { Link } from "@tanstack/react-router";
import { ShopButton } from "@/components/shop/ui/shop-button";
import { useShopDialog } from "@/lib/stores/shop-dialog";
import { useShopSession } from "@/lib/stores/shop-session";
import { GrainFilter } from "./grain-filter";
import { picsumId } from "./home-data";

export function StoryCta() {
  const user = useShopSession((s) => s.user);
  const openDialog = useShopDialog((s) => s.open);

  return (
    <section
      aria-labelledby="story-title"
      className="relative overflow-hidden bg-(--sh-home-a) pt-16 pb-28 md:pt-24 md:pb-[130px]"
    >
      {/* Dải sóng đỉnh lớn / nhỏ xen kẽ tràn hết bề ngang ở đáy, mép tan thành hạt, nằm dưới ảnh */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 aspect-[1440/233] min-h-[110px]"
      >
        <svg className="size-full" viewBox="0 -30 1440 233" preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id="story-wave-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e3a0d4" />
              <stop offset="30%" stopColor="#e199bd" />
              <stop offset="55%" stopColor="#e09391" />
              <stop offset="100%" stopColor="#e09391" />
            </linearGradient>
            <GrainFilter id="story-wave-grain" blur={12} seed={9} />
          </defs>
          <path d="M-80,46 C-62,40 -7,1 30,10 C67,19 101,94 140,100 C179,106 227,49 265,47 C303,45 336,95 370,89 C404,83 435,6 470,9 C505,12 542,98 580,104 C618,110 662,48 700,46 C738,44 774,99 810,93 C846,87 878,10 915,11 C952,12 991,96 1030,102 C1069,108 1113,46 1150,45 C1187,44 1217,101 1250,95 C1283,89 1315,11 1350,10 C1385,9 1425,82 1460,89 C1495,96 1543,59 1560,53 L1560,340 L-80,340 Z" fill="url(#story-wave-grad)" filter="url(#story-wave-grain)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-[1280px] px-4 xl:px-0">
        <div className="grid gap-12 lg:grid-cols-[1fr_624px] lg:items-center">
          {/* Cột chữ bên trái */}
          <div>
            <h2
              id="story-title"
              className="font-display text-3xl leading-[1.1] font-bold text-(--sh-fg) sm:text-4xl md:text-[64px]"
            >
              <span className="block text-balance">Kể câu chuyện của bạn</span>
              <span className="block">bằng màu sắc</span>
            </h2>

            <div className="mt-8 md:mt-14">
              {!user ? (
                <ShopButton
                  variant="primary"
                  className="h-12 rounded-[4px] px-8 text-lg"
                  onClick={() => openDialog({ type: "register" })}
                >
                  Bắt đầu miễn phí
                </ShopButton>
              ) : (
                <ShopButton asChild variant="primary" className="h-12 rounded-[4px] px-8 text-lg">
                  <Link to="/luts">Khám phá kho LUT</Link>
                </ShopButton>
              )}
            </div>
          </div>

          {/* 3 ảnh chồng nhau (khung 624×559 như bản tham chiếu), ảnh trước đè lên dải sóng */}
          <div className="relative mx-auto aspect-[624/559] w-full max-w-[624px]">
            <div className="absolute top-0 left-0 aspect-[382/368] w-[61.2%] overflow-hidden">
              <img src={picsumId(65, 764, 736)} alt="" width={764} height={736} loading="lazy" className="size-full object-cover" />
            </div>
            <div className="absolute top-[22.9%] left-[53.5%] aspect-[290/340] w-[46.5%] overflow-hidden">
              <img src={picsumId(839, 580, 680)} alt="" width={580} height={680} loading="lazy" className="size-full object-cover" />
            </div>
            <div className="absolute top-[47.6%] left-[33%] z-20 aspect-[235/293] w-[37.7%] overflow-hidden shadow-2xl">
              <img src={picsumId(129, 470, 586)} alt="" width={470} height={586} loading="lazy" className="size-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
