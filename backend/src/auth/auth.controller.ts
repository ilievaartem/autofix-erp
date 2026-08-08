import type { NextFunction, Request, Response } from "express";
import { AuthService, InvalidCredentialsError } from "./auth.service.js";

interface LoginBody {
  workshopId?: unknown;
  email?: unknown;
  password?: unknown;
}

export class AuthController {
  constructor(private readonly auth: AuthService) {}

  login = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const body = request.body as LoginBody | null;

    if (
      !body ||
      typeof body.workshopId !== "string" ||
      typeof body.email !== "string" ||
      typeof body.password !== "string" ||
      !body.workshopId.trim() ||
      !body.email.trim() ||
      !body.password
    ) {
      response.status(400).json({
        error: "VALIDATION_ERROR",
        message: "workshopId, email and password are required",
      });
      return;
    }

    try {
      const result = await this.auth.login({
        workshopId: body.workshopId.trim(),
        email: body.email,
        password: body.password,
      });
      response.status(200).json(result);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        response.status(401).json({
          error: "INVALID_CREDENTIALS",
          message: error.message,
        });
        return;
      }

      next(error);
    }
  };
}
