import { FlaskConical } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";

export function EvalTab() {
  return (
    <div className="py-12">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FlaskConical className="size-6 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>Chưa có lần chạy đánh giá nào</EmptyTitle>
          <EmptyDescription>
            Kết quả đánh giá offline (Precision, Recall, NDCG, độ đa dạng) sẽ hiện ở đây khi trình
            đánh giá chạy lần đầu.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
