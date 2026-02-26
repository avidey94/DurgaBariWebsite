import { LoginForm } from "@/components/login-form";
import { env, isSupabaseConfigured } from "@/lib/env";
import { resolveLanguage } from "@/lib/i18n";

interface LoginPageProps {
  searchParams: Promise<{ error?: string; lang?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const lang = resolveLanguage(params.lang);
  const error = params.error;
  const isBn = lang === "bn";

  return (
    <section className="mx-auto max-w-xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {isBn ? "সাইন ইন" : "Sign in"}
        </h1>
        <p className="mt-2 text-sm text-slate-700">
          {isBn
            ? "Supabase ইমেইল অথ ব্যবহার করে ম্যাজিক লিংক, পাসওয়ার্ড লগইন বা নতুন অ্যাকাউন্ট তৈরি করুন।"
            : "Use Supabase email auth with magic links, password sign-in, or account creation."}
        </p>
      </div>
      <LoginForm
        language={lang}
        supabaseConfigured={isSupabaseConfigured}
        devBypassEnabled={Boolean(env.devLoginEmail)}
        initialError={error}
      />
    </section>
  );
}
