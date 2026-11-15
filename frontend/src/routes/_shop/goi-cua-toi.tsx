import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { MyPlanPage } from "@/components/shop/subscription/my-plan-page";

const searchSchema = z.object({
  trang: z.coerce.number().int().min(1).optional().catch(undefined)
});

export const Route = createFileRoute("/_shop/goi-cua-toi")({
  validateSearch: searchSchema,
  component: MyPlanPage
});
