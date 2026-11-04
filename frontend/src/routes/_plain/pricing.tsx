import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { PricingPage } from "@/components/shop/pricing/pricing-page";

export const Route = createFileRoute("/_plain/pricing")({
  component: function Pricing() {
    useEffect(() => {
      document.title = "Bảng giá | DownBeat";
    }, []);
    return <PricingPage />;
  }
});
