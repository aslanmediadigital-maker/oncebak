import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function redirectToLogin(
  request: NextRequest,
  status: "onaylandi" | "onay-hatasi"
) {
  const destination = new URL("/giris", request.url);
  destination.searchParams.set("durum", status);
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return redirectToLogin(request, "onay-hatasi");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirectToLogin(request, "onay-hatasi");
    }

    return redirectToLogin(request, "onaylandi");
  } catch {
    return redirectToLogin(request, "onay-hatasi");
  }
}
