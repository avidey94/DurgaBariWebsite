import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthWorkspace } from "@/components/auth-workspace";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { createServerSupabaseClient } from "@/lib/auth/supabase";
import { resolveLanguage } from "@/lib/i18n";

export const metadata: Metadata = { title: "Reset your password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const language = resolveLanguage((await searchParams).lang);
  const supabase = await createServerSupabaseClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!data.user) {
    redirect(`/login?error=reset_link_expired${language === "bn" ? "&lang=bn" : ""}`);
  }

  return (
    <AuthWorkspace language={language}>
      <ResetPasswordForm email={data.user.email ?? ""} language={language} />
    </AuthWorkspace>
  );
}
