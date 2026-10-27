import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/reset-password-form";
import { createServerSupabaseClient } from "@/lib/auth/supabase";

export default async function ResetPasswordPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!data.user) {
    redirect("/login?error=reset_link_expired");
  }

  return (
    <section className="db-shell max-w-3xl">
      <ResetPasswordForm email={data.user.email ?? ""} />
    </section>
  );
}
