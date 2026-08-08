import { createServer } from "node:http";
import { createApp } from "./app.js";
import { getAppConfig } from "./config/env.js";
import { createPrismaClient } from "./database/prisma.js";
import { PrismaUserRepository } from "./database/prisma-user.repository.js";

async function main(): Promise<void> {
  const config = getAppConfig();
  const prisma = await createPrismaClient(config.databaseUrl);
  const app = createApp({
    users: new PrismaUserRepository(prisma),
    jwtSecret: config.jwtSecret,
    jwtExpiresInSeconds: config.jwtExpiresInSeconds,
  });
  const server = createServer(app);

  server.listen(config.port, "0.0.0.0", () => {
    console.log(`AutoFix API is listening on port ${config.port}`);
  });

  const shutdown = async (): Promise<void> => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

main().catch((error: unknown) => {
  console.error("Failed to start AutoFix API", error);
  process.exit(1);
});
