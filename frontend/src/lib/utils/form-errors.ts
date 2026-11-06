import type { z } from "zod";

/** Lỗi zod → `{ tênField: message đầu tiên }`, dùng cho dialog `FormDialog` + `useState`. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !result[key]) result[key] = issue.message;
  }
  return result;
}
