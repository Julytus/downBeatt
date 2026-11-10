import { createFileRoute } from "@tanstack/react-router";
import { CollectionDetailPage } from "@/components/shop/collection/collection-detail-page";

export const Route = createFileRoute("/_shop/bo-suu-tap/$id")({
  component: CollectionDetailRoute
});

function CollectionDetailRoute() {
  const { id } = Route.useParams();
  return <CollectionDetailPage id={id} />;
}
