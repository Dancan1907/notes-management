// backend/src/modules/auth/two-factor.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { TwoFactorService } from "./two-factor.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";
import { Enable2faDto } from "./dto/enable-2fa.dto";
import { Verify2faDto } from "./dto/verify-2fa.dto";
import { Disable2faDto } from "./dto/disable-2fa.dto";
import { Generate2faResponseDto } from "./dto/generate-2fa-response.dto";
import { AuthService } from "./auth.service";
import * as argon2 from "argon2";
import { Logger } from "nestjs-pino";
import { User } from "@prisma/client"; // Import the User type

@ApiTags("Two-Factor Authentication")
@Controller("2fa")
export class TwoFactorController {
  constructor(
    private twoFactorService: TwoFactorService,
    private authService: AuthService,
    private logger: Logger,
  ) {}

  @Post("generate")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Generate 2FA secret and QR code" })
  @ApiResponse({
    status: 200,
    description: "Secret and QR code generated",
    type: Generate2faResponseDto,
  })
  async generate(@Request() req: any): Promise<Generate2faResponseDto> {
    const user = req.user; // { userId, email, role }
    // Generate the secret and QR code
    const result = await this.twoFactorService.generateSecret(user.email);

    // Save the secret to the user's record
    await this.authService["prisma"].user.update({
      where: { id: user.userId },
      data: { twoFactorSecret: result.secret },
    });

    return result;
  }

  @Post("enable")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Enable 2FA for current user" })
  @ApiResponse({
    status: 200,
    description: "2FA enabled successfully",
    schema: {
      type: "object",
      properties: {
        backupCodes: { type: "array", items: { type: "string" } },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid TOTP code" })
  async enable(@Request() req: any, @Body() dto: Enable2faDto) {
    const user = req.user;
    const { userId } = user;

    const dbUser = await this.authService["prisma"].user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true },
    });

    if (!dbUser?.twoFactorSecret) {
      throw new BadRequestException(
        "No 2FA secret found. Please generate one first.",
      );
    }

    const isValid = this.twoFactorService.verifyTOTP(
      dbUser.twoFactorSecret,
      dto.code!, // non-null assertion
    );

    if (!isValid) {
      throw new BadRequestException("Invalid TOTP code");
    }

    const { backupCodes } = await this.twoFactorService.enableTwoFactor(
      userId,
      dbUser.twoFactorSecret,
    );

    return { backupCodes };
  }

  @Post("disable")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Disable 2FA (requires password)" })
  @ApiResponse({ status: 200, description: "2FA disabled" })
  @ApiResponse({ status: 401, description: "Invalid password" })
  async disable(@Request() req: any, @Body() dto: Disable2faDto) {
    const user = req.user;
    const { userId } = user;

    const dbUser = await this.authService["prisma"].user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!dbUser) {
      throw new UnauthorizedException("User not found");
    }

    const isValidPassword = await argon2.verify(dbUser.password, dto.password!);
    if (!isValidPassword) {
      throw new UnauthorizedException("Invalid password");
    }

    await this.twoFactorService.disableTwoFactor(userId);

    return { message: "2FA disabled successfully" };
  }

  @Public()
  @Post("verify")
  @ApiOperation({ summary: "Verify 2FA code and complete login" })
  @ApiResponse({
    status: 200,
    description: "2FA verified successfully",
    schema: {
      type: "object",
      properties: {
        access_token: { type: "string" },
        refresh_token: { type: "string" },
        user: { type: "object" },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Invalid code or temp token" })
  async verify(@Body() dto: Verify2faDto) {
    const tempToken = dto.tempToken;
    if (!tempToken) {
      throw new UnauthorizedException("Temporary token required");
    }

    let payload: any;
    try {
      payload = this.authService["jwtService"].verify(tempToken, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException("Invalid temporary token");
    }

    if (!payload || payload.scope !== "2fa") {
      throw new UnauthorizedException("Invalid temporary token");
    }

    const userId = payload.sub;

    const user = await this.authService["prisma"].user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        twoFactorSecret: true,
        isTwoFactorEnabled: true,
      },
    });

    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException("2FA not enabled for this user");
    }

    let isValid = false;
    const isTOTPValid = this.twoFactorService.verifyTOTP(
      user.twoFactorSecret,
      dto.code!,
    );

    if (isTOTPValid) {
      isValid = true;
    } else {
      const isBackupValid = await this.twoFactorService.verifyBackupCode(
        userId,
        dto.code!,
      );
      if (isBackupValid) {
        isValid = true;
        this.logger.log(`Backup code used for user ${userId}`);
      }
    }

    if (!isValid) {
      throw new UnauthorizedException("Invalid TOTP or backup code");
    }

    // Fetch full user details for response
    const fullUser = await this.authService["prisma"].user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!fullUser) {
      throw new UnauthorizedException("User not found");
    }

    // Generate tokens
    const tokens = await this.authService["generateTokens"](fullUser as User);

    // Store refresh token
    await this.authService["prisma"].user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refresh_token },
    });

    // Return tokens and user info
    return {
      ...tokens,
      user: fullUser,
    };
  }
}
