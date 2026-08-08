export const USER_ROLES = ["OWNER", "MANAGER", "MECHANIC", "CLIENT"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface AuthContext {
  userId: string;
  workshopId: string;
  email: string;
  role: UserRole;
}

export interface AuthUser extends AuthContext {
  firstName: string;
  lastName: string;
  passwordHash: string | null;
}

export interface LoginInput {
  workshopId: string;
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: Omit<AuthUser, "passwordHash">;
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}
