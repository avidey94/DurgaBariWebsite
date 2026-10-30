import type { Metadata } from "next";

import { AuthWorkspace } from "@/components/auth-workspace";
import { LoginForm } from "@/components/login-form";
import { isDevLoginEnabled, isSupabaseConfigured } from "@/lib/env";
import { resolveLanguage } from "@/lib/i18n";

interface LoginPageProps {
  searchParams: Promise<{ error?: string; lang?: string; mode?: string; next?: string }>;
}

export const metadata: Metadata = { title: "Member sign in" };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const lang = resolveLanguage(params.lang);
  const error = params.error;

  return (
    <AuthWorkspace language={lang}>
      <LoginForm
        language={lang}
        returnTo={
          params.next?.startsWith("/calendar") && !params.next.includes("\\")
            ? params.next
            : "/portal"
        }
        supabaseConfigured={isSupabaseConfigured}
        devBypassEnabled={isDevLoginEnabled}
        initialError={error}
        initialMode={
          error === "reset_link_expired"
            ? "recovery"
            : params.mode === "signup"
              ? "signup"
              : "password"
        }
      />
    </AuthWorkspace>
  );
}
