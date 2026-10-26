import "server-only";

/* Server secrets. Missing values fail loudly at the moment they are first needed. */
function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return v;
}

export const env = {
  supabaseUrl: () => process.env.NEXT_PUBLIC_SUPABASE_URL || need("SUPABASE_URL"),
  // new-style secret key (sb_secret_…) or the legacy service_role JWT; either bypasses RLS, server only
  supabaseServiceKey: () => process.env.SUPABASE_SECRET_KEY || need("SUPABASE_SERVICE_ROLE_KEY"),
  resendKey: () => need("RESEND_API_KEY"),
  payLinkSecret: () => need("LINK_SECRET"),
  cronSecret: () => need("CRON_SECRET"),
  /** where contact-form messages go */
  contactInbox: () => process.env.CONTACT_INBOX || "hello@smashcorner-qc.com",
  /** "true" = log emails to the console instead of sending (local development) */
  /** send every email to this one address instead (testing before a domain is verified) */
  emailTestTo: () => process.env.EMAIL_TEST_TO || "",
  emailDryRun: () => process.env.EMAIL_DRY_RUN === "true" || !process.env.RESEND_API_KEY,
};
