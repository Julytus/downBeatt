import { useEffect } from "react";
import { ShopFooter } from "@/components/shop/layout/footer/shop-footer";
import { ShopShell } from "@/components/shop/layout/shop-shell";
import { AuthorsSection } from "./authors-section";
import { CollageSection } from "./collage-section";
import { CreatorsSection } from "./creators-section";
import { FeaturesCarousel } from "./features-carousel";
import { HeroSection } from "./hero-section";
import { HomeFaq } from "./home-faq";
import { HomeHeader } from "./home-header";
import { LicenseBand } from "./license-band";
import { PlansSection } from "./plans-section";
import { PromptSearchSection } from "./prompt-search-section";
import { StoryCta } from "./story-cta";
import { ValuesBand } from "./values-band";

export function HomePage() {
  useEffect(() => {
    document.title = "DownBeat | Kho LUT chỉnh màu cho nhà sáng tạo";
  }, []);

  return (
    <ShopShell className="shop-home flex flex-col">
      <HomeHeader />
      <main id="shop-main" className="flex-1">
        <HeroSection />
        <CreatorsSection />
        <ValuesBand />
        <AuthorsSection />
        <CollageSection />
        <PromptSearchSection />
        <FeaturesCarousel />
        <LicenseBand />
        <PlansSection />
        <StoryCta />
        <HomeFaq />
      </main>
      <ShopFooter />
    </ShopShell>
  );
}
