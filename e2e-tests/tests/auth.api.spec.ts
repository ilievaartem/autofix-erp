import { createServer, type Server } from "node:http";
import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
} from "@playwright/test";
import { createApp } from "../../backend/dist/app.js";
import { USER_ROLES, type AuthUser, type UserRole } from "../../backend/dist/auth/auth.types.js";
import { hashPassword } from "../../backend/dist/auth/password.js";
import type { UserRepository } from "../../backend/dist/auth/user.repository.js";

const workshopId = "11111111-1111-4111-8111-111111111111";
const password = "Test_pass_1122";
const jwtSecret = "autofix-playwright-test-secret-at-least-32-characters";

class InMemoryUserRepository implements UserRepository {
  constructor(private readonly users: AuthUser[]) {}

  async findActiveByEmail(targetWorkshopId: string, email: string): Promise<AuthUser | null> {
    return (
      this.users.find(
        (user) => user.workshopId === targetWorkshopId && user.email === email,
      ) ?? null
    );
  }
}

let server: Server;
let api: APIRequestContext;

test.beforeAll(async () => {
  const passwordHash = await hashPassword(password);
  const users = USER_ROLES.map((role, index): AuthUser => ({
    userId: `00000000-0000-4000-8000-00000000000${index + 1}`,
    workshopId,
    email: `${role.toLowerCase()}@autofix.test`,
    role,
    firstName: role[0] + role.slice(1).toLowerCase(),
    lastName: "Tester",
    passwordHash,
  }));
  const app = createApp({
    users: new InMemoryUserRepository(users),
    jwtSecret,
    jwtExpiresInSeconds: 3600,
    registerAdditionalRoutes: (testApp, middleware) => {
      testApp.get(
        "/api/test/management",
        middleware.authenticateJwt,
        middleware.requireRoles("OWNER", "MANAGER"),
        (_request, response) => response.status(200).json({ allowed: true }),
      );
    },
  });

  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not expose a TCP port");
  }

  api = await playwrightRequest.newContext({ baseURL: `http://127.0.0.1:${address.port}` });
});

test.afterAll(async () => {
  await api.dispose();
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

async function login(role: UserRole) {
  const response = await api.post("/api/auth/login", {
    data: {
      workshopId,
      email: `${role.toLowerCase()}@autofix.test`,
      password,
    },
  });

  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<{
    accessToken: string;
    user: { role: UserRole; workshopId: string };
  }>;
}

for (const role of USER_ROLES) {
  test(`issues a tenant-scoped JWT for ${role}`, async () => {
    const result = await login(role);

    expect(result.accessToken.split(".")).toHaveLength(3);
    expect(result.user).toMatchObject({ role, workshopId });

    const me = await api.get("/api/auth/me", {
      headers: { Authorization: `Bearer ${result.accessToken}` },
    });
    expect(me.status()).toBe(200);
    await expect(me.json()).resolves.toMatchObject({ user: { role, workshopId } });
  });
}

test("rejects invalid credentials without revealing which field is wrong", async () => {
  const response = await api.post("/api/auth/login", {
    data: { workshopId, email: "owner@autofix.test", password: "wrong_password" },
  });

  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toEqual({
    error: "INVALID_CREDENTIALS",
    message: "Invalid email or password",
  });
});

test("requires all tenant login fields", async () => {
  const response = await api.post("/api/auth/login", {
    data: { email: "owner@autofix.test", password },
  });

  expect(response.status()).toBe(400);
});

test("returns 401 when a protected route has no token", async () => {
  const response = await api.get("/api/auth/me");
  expect(response.status()).toBe(401);
});

test("allows Owner and Manager into management routes", async () => {
  for (const role of ["OWNER", "MANAGER"] as const) {
    const result = await login(role);
    const response = await api.get("/api/test/management", {
      headers: { Authorization: `Bearer ${result.accessToken}` },
    });
    expect(response.status()).toBe(200);
  }
});

test("forbids Mechanic and Client from management routes", async () => {
  for (const role of ["MECHANIC", "CLIENT"] as const) {
    const result = await login(role);
    const response = await api.get("/api/test/management", {
      headers: { Authorization: `Bearer ${result.accessToken}` },
    });
    expect(response.status()).toBe(403);
  }
});
