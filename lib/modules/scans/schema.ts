import { z } from "zod";

const PRIVATE_HOST =
  /^(localhost|.*\.local|.*\.internal|metadata\.google\.internal|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|\[?::1?\]?|\[?f[cd][0-9a-f]{2}:.*)$/i;

export const createScanSchema = z.object({
  url: z
    .string()
    .trim()
    .url()
    .refine((u) => /^https?:$/.test(new URL(u).protocol), "Only http/https URLs are allowed")
    .refine((u) => !PRIVATE_HOST.test(new URL(u).hostname), "Private/loopback hosts are not allowed"),
  languageMode: z.enum(["bn", "en", "bilingual"]).default("bn"),
});

export type CreateScanInput = z.infer<typeof createScanSchema>;
