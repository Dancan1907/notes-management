// backend/src/modules/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // PassportStrategy calls super with configuration
    super({
      // Extract JWT from the Authorization header as Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Reject expired tokens
      ignoreExpiration: false,
      // Secret key for verifying the token
      secretOrKey: configService.get<string>("JWT_SECRET")!,
    });
  }

  // validate() is called after the token is verified
  // The 'payload' is the decoded JWT payload (sub, email, role, etc.)
  async validate(payload: any) {
    // ✅ FIX: Ensure we have the user ID from the token
    const userId = payload.sub || payload.id;

    if (!userId) {
      throw new UnauthorizedException("Invalid token: missing user ID");
    }

    // ✅ FIX: Fetch the full user from database to ensure they still exist
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        isTwoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("User no longer exists");
    }

    // ✅ FIX: Return user with consistent field names
    // The user object will be attached to request.user
    // With both 'id' and 'userId' for compatibility
    return {
      id: user.id, // ✅ For @CurrentUser('id')
      userId: user.id, // ✅ For backward compatibility
      sub: user.id, // ✅ For JWT standard
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    };
  }
}
