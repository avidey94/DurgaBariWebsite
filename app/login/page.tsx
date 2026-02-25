import { LoginForm } from "@/components/login-form";
import { env, isSupabaseConfigured } from "@/lib/env";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const error = (await searchParams).error;

  return (
    <section className="mx-auto max-w-xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-700">
          Use Supabase email auth with magic links, password sign-in, or account creation.
        </p>
      </div>
      <LoginForm
        supabaseConfigured={isSupabaseConfigured}
        devBypassEnabled={Boolean(env.devLoginEmail)}
        initialError={error}
      />
    </section>
  );
}
