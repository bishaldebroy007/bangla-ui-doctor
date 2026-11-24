import { connection, NextResponse } from "next/server";
import { createScanSchema } from "@/lib/modules/scans/schema";
import { createScan, listScans } from "@/lib/modules/scans/service";
import { SsrfValidationError } from "@/lib/modules/scans/ssrf";

export async function GET() {
  await connection();
  return NextResponse.json({ scans: await listScans() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createScanSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json(
      { error: message, issues: parsed.error.issues },
      { status: 400 }
    );
  }
  try {
    const result = await createScan(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof SsrfValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message =
      err instanceof Error ? err.message : "Failed to complete browser diagnostic scan.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
