import { Link } from "@tanstack/react-router";
import { LogOut, RefreshCw, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Không lấy được thông tin tài khoản (backend lỗi 5xx / mất kết nối). Thay cho màn "Đang tải" treo mãi:
 * cho thử lại, hoặc đăng xuất để đăng nhập lại.
 */
export function AdminLoadError({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center p-6">
      <Card className="bg-background shadow-foreground/5 w-full max-w-md rounded-3xl border-0 shadow-xl">
        <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
          <div className="bg-destructive/10 text-destructive flex size-16 items-center justify-center rounded-full">
            <ServerCrash className="size-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-foreground text-2xl font-bold tracking-tight">Không kết nối được máy chủ</h1>
            <p className="text-muted-foreground">
              Không tải được thông tin tài khoản. Kiểm tra backend đã chạy chưa rồi thử lại.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={onRetry} disabled={retrying} className="rounded-full px-6">
              <RefreshCw className={retrying ? "animate-spin" : undefined} />
              Thử lại
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6">
              <Link to="/logout">
                <LogOut />
                Đăng xuất
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
