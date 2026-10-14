import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { password = "" } = await request.json() as { password?: string };
  const expected = process.env.ADMIN_PASSWORD;
  if (expected && password !== expected) return NextResponse.json({ error: "That access code doesn't match. Give it another try." }, { status: 401 });
  if (!expected && process.env.NODE_ENV !== "development") return NextResponse.json({ error: "Set ADMIN_PASSWORD in the server environment before opening the admin panel." }, { status: 503 });
  return NextResponse.json({ ok: true, mode: expected ? "protected" : "local-demo" });
}
