import { config as loadDotEnv } from "dotenv";
import { fileURLToPath } from "node:url";

loadDotEnv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

export interface AppConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresInSeconds: number;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function positiveInteger(name: string, fallback?: string): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return value;
}

function createDatabaseUrl(): string {
  const url = new URL("postgresql://localhost");
  url.username = requireEnv("POSTGRES_USER");
  url.password = requireEnv("POSTGRES_PASSWORD");
  url.hostname = process.env["POSTGRES_HOST"]?.trim() || "localhost";
  url.port = process.env["POSTGRES_PORT"]?.trim() || "5432";
  url.pathname = requireEnv("POSTGRES_DB");
  url.searchParams.set("schema", "public");
  return url.toString();
}

export function getAppConfig(): AppConfig {
  return {
    port: positiveInteger("API_PORT", "3000"),
    databaseUrl: createDatabaseUrl(),
    jwtSecret: requireEnv("JWT_SECRET"),
    jwtExpiresInSeconds: positiveInteger("JWT_EXPIRES_IN_SECONDS", "3600"),
  };
}
