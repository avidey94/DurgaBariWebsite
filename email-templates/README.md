# Supabase Auth email templates

Keep these files in sync with the production Supabase project’s **Authentication → Email Templates** settings.

| Supabase template | Subject                         | Source                |
| ----------------- | ------------------------------- | --------------------- |
| Confirm sign up   | Confirm your Durga Bari account | `confirm-signup.html` |
| Reset password    | Reset your Durga Bari password  | `reset-password.html` |

Both links use Supabase’s token hash so a person can open the email on a different browser or device from the one used at sign-up. The `/auth/confirm` route verifies the token and forwards them to their next step.
