import { LoginForm } from "@/components/login-form";
import { isDevLoginEnabled, isSupabaseConfigured } from "@/lib/env";
import { resolveLanguage } from "@/lib/i18n";

interface LoginPageProps {
  searchParams: Promise<{ error?: string; lang?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const lang = resolveLanguage(params.lang);
  const error = params.error;

  return (
    <section className="mx-auto max-w-xl space-y-6 px-6 py-8">
      <LoginForm
        language={lang}
        supabaseConfigured={isSupabaseConfigured}
        devBypassEnabled={isDevLoginEnabled}
        initialError={error}
      />
    </section>
  );
}
