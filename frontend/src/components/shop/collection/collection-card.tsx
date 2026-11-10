import { Link } from "@tanstack/react-router";
import { FolderHeart, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { ShopButton } from "@/components/shop/ui/shop-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { CollectionDTO } from "@/lib/types/collection";

interface CollectionCardProps {
  collection: CollectionDTO;
  onRename: (collection: CollectionDTO) => void;
  onDelete: (collection: CollectionDTO) => void;
}

export function CollectionCard({ collection, onRename, onDelete }: CollectionCardProps) {
  const covers = collection.coverUrls ?? [];
  const count = covers.length;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[12px] border border-(--sh-border) bg-(--sh-elevated) p-3 transition-colors hover:border-(--sh-border-hover)">
      {/* Khung ảnh ghép 16:9 */}
      <div className="relative aspect-video w-full overflow-hidden rounded-[8px] bg-(--sh-surface)">
        {count === 0 && (
          <div className="flex size-full flex-col items-center justify-center gap-1.5 text-(--sh-muted)">
            <FolderHeart className="size-8 stroke-[1.5]" aria-hidden />
            <span className="text-xs font-medium">Chưa có LUT</span>
          </div>
        )}

        {count === 1 && (
          <img
            src={covers[0]}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        )}

        {count === 2 && (
          <div className="grid size-full grid-cols-2 divide-x divide-black/20">
            <img
              src={covers[0]}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
            <img
              src={covers[1]}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          </div>
        )}

        {count >= 3 && (
          <div className="grid size-full grid-cols-2 grid-rows-2 gap-[1px] bg-black/20">
            {covers.slice(0, 4).map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                loading="lazy"
                className="size-full object-cover"
              />
            ))}
            {count === 3 && <div className="size-full bg-(--sh-surface)" />}
          </div>
        )}

        {/* Nút tuỳ chọn ⋯ (rê chuột mới hiện trên desktop, luôn hiện trên mobile) */}
        <div className="absolute top-2 right-2 z-20 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <ShopButton
                variant="overlay"
                size="icon-sm"
                aria-label={`Tuỳ chọn cho ${collection.name}`}
              >
                <MoreHorizontal className="size-4" />
              </ShopButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="shop border-(--sh-border) bg-(--sh-elevated) text-(--sh-fg)">
              <DropdownMenuItem onSelect={() => onRename(collection)}>
                <Pencil className="size-4" />
                Đổi tên
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onDelete(collection)}
                className="text-(--sh-danger) focus:text-(--sh-danger)"
              >
                <Trash2 className="size-4" />
                Xoá
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Link phủ toàn thẻ để điều hướng */}
      <Link
        to="/bo-suu-tap/$id"
        params={{ id: String(collection.id) }}
        aria-label={`Mở bộ sưu tập ${collection.name}`}
        className="absolute inset-0 z-10 rounded-[12px] outline-none focus-visible:ring-2 focus-visible:ring-(--sh-pink)"
      />

      {/* Thông tin bộ sưu tập */}
      <div className="mt-3 flex flex-col gap-0.5">
        <h3 className="truncate text-base font-semibold text-(--sh-fg)">
          {collection.name}
        </h3>
        <p className="text-xs text-(--sh-muted)">
          {collection.itemCount > 0 ? `${collection.itemCount} LUT` : "0 LUT"}
        </p>
      </div>
    </article>
  );
}
