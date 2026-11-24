import "server-only";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getEnv } from "@/lib/server/env";

const g = globalThis as unknown as { __s3?: S3Client };

// Neon Object Storage: AWS_* env vars are read by the SDK; path-style is required.
function s3() {
  return (g.__s3 ??= new S3Client({ forcePathStyle: true }));
}

const bucket = () => getEnv().STORAGE_BUCKET;

export async function putJson(key: string, value: unknown) {
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: JSON.stringify(value),
      ContentType: "application/json",
    }),
  );
}

export async function getJson<T>(key: string): Promise<T> {
  const res = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  return JSON.parse((await res.Body!.transformToString()) as string) as T;
}

export function presignGet(key: string, expiresIn = 3600) {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn });
}
