import type { AuthUser } from "../auth/auth.types.js";
import type { UserRepository } from "../auth/user.repository.js";
import type { AppPrismaClient } from "./prisma.js";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findActiveByEmail(workshopId: string, email: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        workshopId,
        email,
        isActive: true,
        workshop: { isActive: true },
      },
      select: {
        id: true,
        workshopId: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      workshopId: user.workshopId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      passwordHash: user.passwordHash,
    };
  }
}
