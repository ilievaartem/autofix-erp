import { Router } from "express";
import type { AuthMiddleware } from "../middleware/auth.middleware.js";
import { USER_ROLES } from "./auth.types.js";
import type { AuthController } from "./auth.controller.js";

export function createAuthRouter(
  controller: AuthController,
  middleware: AuthMiddleware,
): Router {
  const router = Router();

  router.post("/login", controller.login);
  router.get(
    "/me",
    middleware.authenticateJwt,
    middleware.requireRoles(...USER_ROLES),
    (request, response) => {
      response.status(200).json({ user: request.auth });
    },
  );

  return router;
}
