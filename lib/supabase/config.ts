// NOTE: For Next.js to expose env vars to the browser, they must be accessed
// via static property names like `process.env.NEXT_PUBLIC_*`. Using
// dynamic indexing (e.g. process.env[key]) will NOT work on the client.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

const requireEnvValue = (value: string | undefined, description: string) => {
  if (!value) {
    throw new Error(
      `Missing Supabase environment variable: ${description}. Please set it in your environment or .env file.`,
    )
  }
  return value
}

export const getSupabaseUrl = () =>
  requireEnvValue(SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL")

export const getSupabaseAnonKey = () =>
  requireEnvValue(
    SUPABASE_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY",
  )
