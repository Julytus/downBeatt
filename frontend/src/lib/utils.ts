import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gộp class Tailwind (clsx + tailwind-merge). Mọi component dùng hàm này, không dùng package `cn`. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
