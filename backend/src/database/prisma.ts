import { PrismaClient } from "../generated/prisma/client.js";

interface PrismaPgModule {
  PrismaPg: new (options: { connectionString: string }) => unknown;
}

export async function createPrismaClient(connectionString: string): Promise<PrismaClient> {
  // A variable import keeps the test server independent of the production-only driver.
  const moduleName = "@prisma/adapter-pg";
  const { PrismaPg } = (await import(moduleName)) as PrismaPgModule;
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

export type AppPrismaClient = PrismaClient;
