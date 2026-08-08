import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { AuthController } from "./auth/auth.controller.js";
import { AuthService } from "./auth/auth.service.js";
import { createAuthRouter } from "./auth/auth.routes.js";
import { JwtService } from "./auth/jwt.service.js";
import type { UserRepository } from "./auth/user.repository.js";
import { createAuthMiddleware, type AuthMiddleware } from "./middleware/auth.middleware.js";

export interface CreateAppOptions {
  users: UserRepository;
  jwtSecret: string;
  jwtExpiresInSeconds: number;
  registerAdditionalRoutes?: (app: Express, middleware: AuthMiddleware) => void;
}

export function createApp(options: CreateAppOptions): Express {
  const app = express();
  const jwt = new JwtService(options.jwtSecret, options.jwtExpiresInSeconds);
  const authService = new AuthService(options.users, jwt);
  const authController = new AuthController(authService);
  const authMiddleware = createAuthMiddleware(jwt);

  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });
  app.use("/api/auth", createAuthRouter(authController, authMiddleware));

  options.registerAdditionalRoutes?.(app, authMiddleware);

  app.use((_request, response) => {
    response.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
  });

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof SyntaxError && "body" in error) {
      response.status(400).json({ error: "INVALID_JSON", message: "Request body is not valid JSON" });
      return;
    }

    console.error(error);
    response.status(500).json({ error: "INTERNAL_ERROR", message: "An unexpected error occurred" });
  });

  return app;
}
