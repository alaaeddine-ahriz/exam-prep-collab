/**
 * Service Layer Entry Point
 * 
 * This module provides a factory function to get the appropriate data service
 * based on the current environment configuration.
 * 
 * Usage:
 * ```typescript
 * import { getDataService } from "@/app/lib/services";
 * 
 * const service = await getDataService();
 * const questions = await service.questions.getAllQuestions();
 * ```
 * 
 * Environment Configuration:
 * - Set NEXT_PUBLIC_DATA_PROVIDER=sqlite for SQLite (default in development)
 * - Set NEXT_PUBLIC_DATA_PROVIDER=supabase for Supabase (default in production)
 * - Or rely on NODE_ENV: development uses SQLite, production uses Supabase
 */

// Re-export types for convenience
export * from "./types";
export * from "./interfaces";

import { IDataService } from "./interfaces";
import { env, validateEnvConfig, logEnvConfig } from "../config";
import { SQLiteDataService } from "./sqlite";
import { SupabaseDataService } from "./supabase";

let dataService: IDataService | null = null;
let initializationPromise: Promise<IDataService> | null = null;

/**
 * Get the data service instance.
 * 
 * This function is safe to call multiple times - it will return the same
 * instance after the first initialization.
 * 
 * The service provider is determined by the environment configuration:
 * - NEXT_PUBLIC_DATA_PROVIDER environment variable (takes precedence)
 * - NODE_ENV (development = sqlite, production = supabase)
 * 
 * @returns Promise<IDataService> The initialized data service
 * @throws Error if Supabase is configured but credentials are missing
 */
export async function getDataService(): Promise<IDataService> {
  // Return cached instance if available
  if (dataService) {
    return dataService;
  }

  // Prevent multiple simultaneous initializations
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    // Log configuration on first initialization
    if (env.isDevelopment) {
      logEnvConfig();
    }

    // Validate environment configuration
    validateEnvConfig();

    // Create the appropriate service based on configuration
    if (env.dataProvider === "supabase") {
      console.log("🔗 Initializing Supabase data service...");
      dataService = new SupabaseDataService();
    } else {
      console.log("📁 Initializing SQLite data service...");
      dataService = new SQLiteDataService();
    }

    // Initialize the service
    await dataService.initialize();

    return dataService;
  })();

  return initializationPromise;
}

/**
 * Close the data service and release resources.
 * 
 * Call this when shutting down the application or when you need to
 * reinitialize with different settings.
 */
export async function closeDataService(): Promise<void> {
  if (dataService) {
    await dataService.close();
    dataService = null;
    initializationPromise = null;
    console.log("🔒 Data service closed");
  }
}

/**
 * Get the current data provider type.
 * 
 * Useful for conditional logic or debugging.
 */
export function getCurrentProvider(): "sqlite" | "supabase" {
  return env.dataProvider;
}

/**
 * Check if the data service is using SQLite.
 */
export function isUsingSQLite(): boolean {
  return env.dataProvider === "sqlite";
}

/**
 * Check if the data service is using Supabase.
 */
export function isUsingSupabase(): boolean {
  return env.dataProvider === "supabase";
}
