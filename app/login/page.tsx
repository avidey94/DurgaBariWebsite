import { LoginForm } from "@/components/login-form";
import { isDevLoginEnabled, isSupabaseConfigured } from "@/lib/env";
import { resolveLanguage } from "@/lib/i18n";

interface LoginPageProps {
  searchParams: Promise<{ error?: string; lang?: string; mode?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const lang = resolveLanguage(params.lang);
  const error = params.error;

  return (
    <section className="db-shell max-w-3xl">
      <LoginForm
        language={lang}
        supabaseConfigured={isSupabaseConfigured}
        devBypassEnabled={isDevLoginEnabled}
        initialError={error}
        initialMode={params.mode === "signup" ? "signup" : "password"}
      />
    </section>
  );
}
