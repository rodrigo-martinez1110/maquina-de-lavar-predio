import { z } from "zod";
export { parsePublicEnv, publicEnv } from "./public-env";

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  APARTMENT_SESSION_SECRET: z.string().min(16),
  ADMIN_PASSWORD: z.string().min(8),
});

type Env = z.infer<typeof EnvSchema>;

export function parseEnv(source: Record<string, string | undefined>) {
  return EnvSchema.parse(source);
}

export const env = new Proxy({} as Env, {
  get(_target, prop: keyof Env) {
    return parseEnv(process.env)[prop];
  },
});
