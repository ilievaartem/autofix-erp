import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const databaseUrl = new URL("postgresql://localhost");
databaseUrl.username = requireEnv("POSTGRES_USER");
databaseUrl.password = requireEnv("POSTGRES_PASSWORD");
databaseUrl.hostname = process.env["POSTGRES_HOST"] ?? "localhost";
databaseUrl.port = process.env["POSTGRES_PORT"] ?? "5432";
databaseUrl.pathname = requireEnv("POSTGRES_DB");
databaseUrl.searchParams.set("schema", "public");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl.toString(),
  },
});
