import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TabLoadErrorProps {
  onRetry: () => void;
  className?: string;
}

export function TabLoadError({ onRetry, className }: TabLoadErrorProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 p-8 text-center rounded-lg border border-dashed ${
        className ?? ""
      }`}
    >
      <AlertCircle className="size-8 text-destructive" />
      <p className="text-sm font-medium text-destructive">Không tải được dữ liệu</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-2 size-3.5" />
        Thử lại
      </Button>
    </div>
  );
}
