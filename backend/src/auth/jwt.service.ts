import { createHmac, timingSafeEqual } from "node:crypto";
import type { AuthContext } from "./auth.types.js";
import { isUserRole } from "./auth.types.js";

interface JwtClaims {
  sub: string;
  workshopId: string;
  email: string;
  role: AuthContext["role"];
  iat: number;
  exp: number;
  iss: "autofix-api";
  aud: "autofix-app";
}

const JWT_HEADER = { alg: "HS256", typ: "JWT" } as const;

function encodeJson(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function parseJsonPart(value: string): unknown {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function isClaims(value: unknown): value is JwtClaims {
  if (!value || typeof value !== "object") {
    return false;
  }

  const claims = value as Partial<JwtClaims>;
  return (
    typeof claims.sub === "string" &&
    typeof claims.workshopId === "string" &&
    typeof claims.email === "string" &&
    isUserRole(claims.role) &&
    Number.isInteger(claims.iat) &&
    Number.isInteger(claims.exp) &&
    claims.iss === "autofix-api" &&
    claims.aud === "autofix-app"
  );
}

export class JwtService {
  constructor(
    private readonly secret: string,
    readonly expiresInSeconds: number,
  ) {
    if (secret.length < 32) {
      throw new Error("JWT_SECRET must contain at least 32 characters");
    }

    if (!Number.isInteger(expiresInSeconds) || expiresInSeconds <= 0) {
      throw new Error("JWT_EXPIRES_IN_SECONDS must be a positive integer");
    }
  }

  sign(context: AuthContext): string {
    const now = Math.floor(Date.now() / 1000);
    const claims: JwtClaims = {
      sub: context.userId,
      workshopId: context.workshopId,
      email: context.email,
      role: context.role,
      iat: now,
      exp: now + this.expiresInSeconds,
      iss: "autofix-api",
      aud: "autofix-app",
    };

    const unsignedToken = `${encodeJson(JWT_HEADER)}.${encodeJson(claims)}`;
    return `${unsignedToken}.${this.createSignature(unsignedToken)}`;
  }

  verify(token: string): AuthContext | null {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedClaims, signature] = parts;
    if (!encodedHeader || !encodedClaims || !signature) {
      return null;
    }

    const unsignedToken = `${encodedHeader}.${encodedClaims}`;
    const expectedSignature = Buffer.from(this.createSignature(unsignedToken));
    const actualSignature = Buffer.from(signature);

    if (
      expectedSignature.length !== actualSignature.length ||
      !timingSafeEqual(expectedSignature, actualSignature)
    ) {
      return null;
    }

    try {
      const header = parseJsonPart(encodedHeader) as Partial<typeof JWT_HEADER>;
      const claims = parseJsonPart(encodedClaims);
      const now = Math.floor(Date.now() / 1000);

      if (header.alg !== "HS256" || header.typ !== "JWT" || !isClaims(claims) || claims.exp <= now) {
        return null;
      }

      return {
        userId: claims.sub,
        workshopId: claims.workshopId,
        email: claims.email,
        role: claims.role,
      };
    } catch {
      return null;
    }
  }

  private createSignature(value: string): string {
    return createHmac("sha256", this.secret).update(value).digest("base64url");
  }
}
