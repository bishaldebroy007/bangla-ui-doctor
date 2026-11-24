import { connection, NextResponse } from "next/server";
import { createScanSchema } from "@/lib/modules/scans/schema";
import { createScan, listScans } from "@/lib/modules/scans/service";


export async function GET() {
  await connection();
  return NextResponse.json({ scans: await listScans() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createScanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }
  const scan = await createScan(parsed.data);
  return NextResponse.json({ scan }, { status: 201 });
}
