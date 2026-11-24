import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  DATABASE_URL_UNPOOLED: z.string().min(1).optional(),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_ENDPOINT_URL_S3: z.string().url(),
  AWS_REGION: z.string().min(1),
  STORAGE_BUCKET: z.string().min(1).default("assets"),
});

let cached: z.infer<typeof schema> | undefined;

/** Validated, lazily-read server environment (kept lazy so `next build` needs no secrets). */
export function getEnv() {
  return (cached ??= schema.parse(process.env));
}
