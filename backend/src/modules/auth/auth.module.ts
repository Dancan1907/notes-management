import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";
import { RefreshStrategy } from "./strategies/refresh.strategy";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailModule } from "../email/email.module";
import { TwoFactorController } from "./two-factor.controller";
import { TwoFactorService } from "./two-factor.service";

@Module({
  imports: [
    // PassportModule registers the strategies
    PassportModule,
    // JwtModule registers JwtService with default options
    // We'll override the secret per method call in AuthService, so we just register it.
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "15m" },
    }),
    // Import PrismaModule so we can use PrismaService
    PrismaModule,
    EmailModule,
  ],
  // Provide the service and strategies
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    RefreshStrategy,
    TwoFactorService,
  ],
  // Expose the controller
  controllers: [AuthController, TwoFactorController],
  // Export AuthService in case other modules need it
  exports: [AuthService],
})
export class AuthModule {}
