import { NextResponse } from "next/server";
import { getWorldCupProvider } from "@/lib/providers";
import { mockProvider } from "@/lib/providers/mockProvider";

export async function GET() {
  try {
    const data = await getWorldCupProvider().getWorldCupData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("World Cup provider failed, falling back to mock data.", error);
    const fallback = await mockProvider.getWorldCupData();
    return NextResponse.json({ ...fallback, provider: "mock" }, { status: 200 });
  }
}
