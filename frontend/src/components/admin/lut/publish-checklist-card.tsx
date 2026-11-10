import { Check, X } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { publishChecklist } from "@/lib/lut-admin/publish-checklist";
import type { LutCategoryDTO } from "@/lib/types/lut";
import type { LutAdminDetailDTO } from "@/lib/types/lut-admin";

export interface PublishChecklistCardProps {
  detail: LutAdminDetailDTO | null | undefined;
  categories: LutCategoryDTO[];
}

export function PublishChecklistCard({
  detail,
  categories
}: PublishChecklistCardProps) {
  const items = publishChecklist(detail, categories);

  return (
    <Card data-slot="card">
      <CardHeader>
        <CardTitle>Điều kiện xuất bản</CardTitle>
        <CardDescription>
          Đạt đủ 5 điều kiện để đưa LUT lên kho công khai
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2 text-sm leading-snug"
            >
              {item.ok ? (
                <>
                  <Check className="size-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
                  <span className="text-foreground">{item.label}</span>
                  <span className="sr-only">Đạt</span>
                </>
              ) : (
                <>
                  <X className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="sr-only">Chưa đạt</span>
                </>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
