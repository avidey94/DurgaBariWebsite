import { NextResponse } from "next/server";

import { listPublicProjects } from "@/lib/portal/server";

export async function GET() {
  const projects = await listPublicProjects(100);
  return NextResponse.json({ projects }, { status: 200 });
}
