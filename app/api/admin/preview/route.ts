import { NextResponse } from "next/server";

import { PREVIEW_COOKIE_NAME, getActivePreviewState } from "@/lib/auth/session";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";

interface PreviewBody {
  mode?: "off" | "logged_out" | "family";
  familyId?: string;
}

const ensureSuperAdmin = async () => {
  const access = await getAdminAccessContext();

  if (!access) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  if (!access.roles.includes("super_admin")) {
    return { error: NextResponse.json({ message: "Only super_admin can use preview mode." }, { status: 403 }) };
  }

  return { access };
};

export async function GET() {
  const auth = await ensureSuperAdmin();

  if ("error" in auth) {
    return auth.error;
  }

  const preview = await getActivePreviewState();

  return NextResponse.json({ preview: preview ?? { active: false } }, { status: 200 });
}

export async function POST(request: Request) {
  const auth = await ensureSuperAdmin();

  if ("error" in auth) {
    return auth.error;
  }

  const body = (await request.json()) as PreviewBody;
  const mode = body.mode ?? "off";

  if (mode === "off") {
    const response = NextResponse.json({ success: true, preview: { active: false } }, { status: 200 });
    response.cookies.delete(PREVIEW_COOKIE_NAME);
    return response;
  }

  if (mode === "logged_out") {
    const response = NextResponse.json(
      {
        success: true,
        preview: {
          active: true,
          mode: "logged_out",
        },
      },
      { status: 200 },
    );

    response.cookies.set(
      PREVIEW_COOKIE_NAME,
      JSON.stringify({ mode: "logged_out" }),
      {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 8,
      },
    );

    return response;
  }

  if (mode === "family") {
    const familyId = (body.familyId ?? "").trim();

    if (!familyId) {
      return NextResponse.json({ message: "familyId is required for family preview." }, { status: 400 });
    }

    const response = NextResponse.json(
      {
        success: true,
        preview: {
          active: true,
          mode: "family",
          familyId,
        },
      },
      { status: 200 },
    );

    response.cookies.set(
      PREVIEW_COOKIE_NAME,
      JSON.stringify({ mode: "family", targetFamilyId: familyId }),
      {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 8,
      },
    );

    return response;
  }

  return NextResponse.json({ message: "Unsupported preview mode." }, { status: 400 });
}

export async function DELETE() {
  const auth = await ensureSuperAdmin();

  if ("error" in auth) {
    return auth.error;
  }

  const response = NextResponse.json({ success: true, preview: { active: false } }, { status: 200 });
  response.cookies.delete(PREVIEW_COOKIE_NAME);
  return response;
}
