import { z } from 'zod';

export const EnvSchema = z
  .object({
    ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
    SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    SUPABASE_ANON_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    CLOUDFLARE_ZONE_ID: z.string().optional(),
    CLOUDFLARE_API_TOKEN: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default('TPF Cinemas <notifications@tpfcinemas.com>'),
    WEBHOOK_SECRET: z.string().optional(),
  })
  .transform((data) => {
    const url = data.SUPABASE_URL || data.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey =
      data.SUPABASE_ANON_KEY ||
      data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      data.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url) {
      throw new Error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
    }
    if (!anonKey) {
      throw new Error(
        'Missing SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY)'
      );
    }
    if (!data.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. Administrative backend requires a valid service role key.');
    }
    if (!data.WEBHOOK_SECRET) {
      throw new Error('Missing WEBHOOK_SECRET. Webhooks require a configured WEBHOOK_SECRET.');
    }

    return {
      ENVIRONMENT: data.ENVIRONMENT,
      SUPABASE_URL: url,
      SUPABASE_ANON_KEY: anonKey,
      SUPABASE_SERVICE_ROLE_KEY: data.SUPABASE_SERVICE_ROLE_KEY,
      CLOUDFLARE_ZONE_ID: data.CLOUDFLARE_ZONE_ID,
      CLOUDFLARE_API_TOKEN: data.CLOUDFLARE_API_TOKEN,
      RESEND_API_KEY: data.RESEND_API_KEY,
      EMAIL_FROM: data.EMAIL_FROM,
      WEBHOOK_SECRET: data.WEBHOOK_SECRET,
    };
  });

export type Bindings = z.output<typeof EnvSchema>;

export function validateEnv(env: unknown): Bindings {
  const result = EnvSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return result.data;
}
