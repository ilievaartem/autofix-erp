import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { UserRole } from "../auth/auth.types.js";
import { JwtService } from "../auth/jwt.service.js";

export interface AuthMiddleware {
  authenticateJwt: RequestHandler;
  requireRoles: (...roles: UserRole[]) => RequestHandler;
}

export function createAuthMiddleware(jwt: JwtService): AuthMiddleware {
  const authenticateJwt = (request: Request, response: Response, next: NextFunction): void => {
    const authorization = request.header("authorization");
    const [scheme, token, extra] = authorization?.split(/\s+/) ?? [];

    if (scheme?.toLowerCase() !== "bearer" || !token || extra) {
      response.status(401).json({
        error: "UNAUTHENTICATED",
        message: "A valid Bearer token is required",
      });
      return;
    }

    const auth = jwt.verify(token);
    if (!auth) {
      response.status(401).json({
        error: "UNAUTHENTICATED",
        message: "Token is invalid or expired",
      });
      return;
    }

    request.auth = auth;
    next();
  };

  const requireRoles = (...roles: UserRole[]): RequestHandler => {
    const allowedRoles = new Set(roles);

    return (request: Request, response: Response, next: NextFunction): void => {
      if (!request.auth) {
        response.status(401).json({
          error: "UNAUTHENTICATED",
          message: "Authentication middleware must run before role authorization",
        });
        return;
      }

      if (!allowedRoles.has(request.auth.role)) {
        response.status(403).json({
          error: "FORBIDDEN",
          message: "Your role does not have access to this resource",
        });
        return;
      }

      next();
    };
  };

  return { authenticateJwt, requireRoles };
}
