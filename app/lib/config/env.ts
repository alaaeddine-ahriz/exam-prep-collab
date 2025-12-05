/**
 * Environment Configuration
 * 
 * Centralized configuration for environment-specific settings.
 * Modify DATA_PROVIDER to switch between SQLite (dev) and Supabase (prod).
 */

export type DataProvider = "sqlite" | "supabase";

/**
 * Determines which data provider to use.
 * 
 * Priority:
 * 1. NEXT_PUBLIC_DATA_PROVIDER environment variable
 * 2. NODE_ENV (development = sqlite, production = supabase)
 * 3. Default to sqlite
 */
function getDataProvider(): DataProvider {
  // Check explicit environment variable first
  const explicitProvider = process.env.NEXT_PUBLIC_DATA_PROVIDER;
  if (explicitProvider === "sqlite" || explicitProvider === "supabase") {
    return explicitProvider;
  }

  // Fall back to NODE_ENV based selection
  if (process.env.NODE_ENV === "production") {
    return "supabase";
  }

  // Default to SQLite for development
  return "sqlite";
}

/**
 * Environment configuration object
 */
export const env = {
  /**
   * Current data provider (sqlite or supabase)
   */
  dataProvider: getDataProvider(),

  /**
   * Whether we're in development mode
   */
  isDevelopment: process.env.NODE_ENV !== "production",

  /**
   * Whether we're in production mode
   */
  isProduction: process.env.NODE_ENV === "production",

  /**
   * Supabase configuration (only used when dataProvider is 'supabase')
   */
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  },

  /**
   * SQLite configuration (only used when dataProvider is 'sqlite')
   */
  sqlite: {
    dbPath: process.env.SQLITE_DB_PATH || "data/examprep.db",
  },

  /**
   * AI/OpenAI configuration
   */
  ai: {
    enabled: !!process.env.OPENAI_API_KEY,
    apiKey: process.env.OPENAI_API_KEY || "",
  },
} as const;

/**
 * Validates that required environment variables are set for the current provider
 */
export function validateEnvConfig(): void {
  if (env.dataProvider === "supabase") {
    if (!env.supabase.url) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for Supabase provider");
    }
    if (!env.supabase.anonKey) {
      throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required for Supabase provider");
    }
  }
}

/**
 * Log current environment configuration (safe for debugging)
 */
export function logEnvConfig(): void {
  console.log("📦 Data Provider:", env.dataProvider);
  console.log("🔧 Environment:", env.isDevelopment ? "development" : "production");
  if (env.dataProvider === "supabase") {
    console.log("🔗 Supabase URL:", env.supabase.url ? "configured" : "missing");
  }
}

