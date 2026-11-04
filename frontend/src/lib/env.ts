import { z } from "zod";

const envSchema = z.object({
  VITE_NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Host được phép truy cập dev server (vite.config.ts → server.allowedHosts)
  VITE_SERVER_URL: z.url().default("http://localhost"),
  // URL tuyệt đối (dev: http://localhost:9200/api) hoặc đường dẫn tương đối "/api" khi chạy sau nginx
  VITE_API_URL: z
    .string()
    .refine((v) => v.startsWith("/") || URL.canParse(v), "VITE_API_URL không hợp lệ")
    .default("http://localhost:9200/api")
});

const env = envSchema.parse(import.meta.env);

export default env;
