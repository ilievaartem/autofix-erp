import type { LoginInput, LoginResult } from "./auth.types.js";
import type { UserRepository } from "./user.repository.js";
import { JwtService } from "./jwt.service.js";
import { consumePasswordVerificationTime, verifyPassword } from "./password.js";

export class InvalidCredentialsError extends Error {}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwt: JwtService,
  ) {}

  async login(input: LoginInput): Promise<LoginResult> {
    const email = input.email.trim().toLowerCase();
    const user = await this.users.findActiveByEmail(input.workshopId, email);

    if (!user?.passwordHash) {
      await consumePasswordVerificationTime(input.password);
      throw new InvalidCredentialsError("Invalid email or password");
    }

    if (!(await verifyPassword(input.password, user.passwordHash))) {
      throw new InvalidCredentialsError("Invalid email or password");
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;
    return {
      accessToken: this.jwt.sign(safeUser),
      tokenType: "Bearer",
      expiresIn: this.jwt.expiresInSeconds,
      user: safeUser,
    };
  }
}
