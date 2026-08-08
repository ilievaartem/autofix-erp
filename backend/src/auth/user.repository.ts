import type { AuthUser } from "./auth.types.js";

export interface UserRepository {
  findActiveByEmail(workshopId: string, email: string): Promise<AuthUser | null>;
}
