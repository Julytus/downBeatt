import { createFileRoute } from "@tanstack/react-router";
import { PaymentResultPage } from "@/components/shop/payment/payment-result-page";

export const Route = createFileRoute("/_plain/thanh-toan/ket-qua/$code")({
  component: PaymentResultRoute
});

function PaymentResultRoute() {
  const { code } = Route.useParams();
  return <PaymentResultPage code={code} />;
}
