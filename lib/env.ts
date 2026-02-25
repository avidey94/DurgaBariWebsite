const splitList = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  dataProvider: process.env.DATA_PROVIDER ?? "mock",
  devLoginEmail: process.env.DEV_LOGIN_EMAIL?.trim().toLowerCase() ?? "",
  adminEmails: splitList(process.env.ADMIN_EMAILS),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  googleSheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? "",
  googleServiceEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL ?? "",
  googlePrivateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY ?? "",
};

export const isSupabaseConfigured =
  Boolean(env.supabaseUrl) && Boolean(env.supabaseAnonKey);

export const isStripeConfigured =
  Boolean(env.stripeSecretKey) && Boolean(env.stripePublishableKey);
