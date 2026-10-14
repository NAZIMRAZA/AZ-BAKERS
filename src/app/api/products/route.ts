import { NextRequest, NextResponse } from "next/server";
import { products as sampleProducts, type Product } from "@/lib/products";

export const dynamic = "force-dynamic";
const sheetUrl = () => process.env.GOOGLE_APPS_SCRIPT_URL?.trim();

export async function GET() {
  const url = sheetUrl();
  if (!url) return NextResponse.json({ products: sampleProducts, source: "sample" });
  try {
    const response = await fetch(url, { cache: "no-store", redirect: "follow" });
    if (!response.ok) throw new Error(`Google Apps Script returned ${response.status}`);
    const data = await response.json();
    const list = Array.isArray(data) ? data : data.products;
    if (!Array.isArray(list)) throw new Error("The Sheets endpoint did not return a products list.");
    return NextResponse.json({ products: list, source: "google-sheets" });
  } catch (error) {
    console.error("Google Sheets menu read failed:", error);
    return NextResponse.json({ error: "Could not load the Google Sheets menu." }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const suppliedPassword = request.headers.get("x-admin-password") || "";
  if (expectedPassword ? suppliedPassword !== expectedPassword : process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Admin access was not accepted." }, { status: 401 });
  }
  const url = sheetUrl();
  const key = process.env.GOOGLE_APPS_SCRIPT_ADMIN_KEY;
  if (!url || !key) return NextResponse.json({ error: "Google Sheets is not configured. Add its deployment URL and admin key to .env.local." }, { status: 503 });
  try {
    const payload = await request.json() as { action?: string; product?: Product; id?: string };
    if (!["create", "update", "delete"].includes(payload.action || "")) return NextResponse.json({ error: "Choose create, update, or delete." }, { status: 400 });
    if (payload.action !== "delete" && (!payload.product?.name?.trim() || !Number.isFinite(payload.product.price) || payload.product.price < 0)) return NextResponse.json({ error: "Add a product name and a valid price." }, { status: 400 });
    const upstream = await fetch(url, { method: "POST", redirect: "follow", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ ...payload, adminKey: key }), cache: "no-store" });
    const data = await upstream.json();
    if (!upstream.ok || data.error) return NextResponse.json({ error: data.error || "Google Sheets could not save the change." }, { status: 502 });
    return NextResponse.json({ ...data, source: "google-sheets" });
  } catch (error) {
    console.error("Google Sheets menu write failed:", error);
    return NextResponse.json({ error: "Could not save to Google Sheets. Check its deployment and server settings." }, { status: 502 });
  }
}
