import { z } from "zod";

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

type PublicEnv = z.infer<typeof PublicEnvSchema>;

export function parsePublicEnv(source: Record<string, string | undefined>) {
  return PublicEnvSchema.parse(source);
}

function readPublicProcessEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export const publicEnv = new Proxy({} as PublicEnv, {
  get(_target, prop: keyof PublicEnv) {
    return parsePublicEnv(readPublicProcessEnv())[prop];
  },
});
