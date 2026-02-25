import { LoginForm } from "@/components/login-form";
import { env, isSupabaseConfigured } from "@/lib/env";

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-700">
          Use Supabase magic link or password login. Local development can bypass auth via
          DEV_LOGIN_EMAIL.
        </p>
      </div>
      <LoginForm supabaseConfigured={isSupabaseConfigured} devBypassEnabled={Boolean(env.devLoginEmail)} />
    </section>
  );
}
