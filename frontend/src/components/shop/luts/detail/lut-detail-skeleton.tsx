import { LutGridSkeleton } from "@/components/shop/luts/lut-grid";
import { Skeleton } from "@/components/ui/skeleton";

/** Khung chờ trang chi tiết LUT (hiện khi loader của route chưa xong) */
export function LutDetailSkeleton() {
  const block = "bg-(--sh-surface)";
  return (
    <div aria-busy="true" aria-label="Đang tải LUT">
      <Skeleton className={`mb-5 h-4 w-56 ${block}`} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <Skeleton className={`aspect-video w-full rounded-[12px] ${block}`} />
        <div className="flex flex-col gap-4">
          <Skeleton className={`h-10 w-3/4 ${block}`} />
          <Skeleton className={`h-4 w-32 ${block}`} />
          <Skeleton className={`h-20 w-full ${block}`} />
          <Skeleton className={`h-10 w-44 rounded-[8px] ${block}`} />
        </div>
      </div>
      <Skeleton className={`mt-14 mb-5 h-6 w-48 ${block}`} />
      <LutGridSkeleton count={4} label="Đang tải LUT liên quan" />
    </div>
  );
}
