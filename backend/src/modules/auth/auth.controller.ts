import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request as Req,
} from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { TokenResponseDto } from "./dto/token.dto";
import { RequestResetDto } from "./dto/request-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ResetResponseDto } from "./dto/reset-response.dto";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RefreshGuard } from "../../common/guards/refresh.guard";
import { Throttle } from "@nestjs/throttler";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("register")
  // Limit to 5 requests per minute for registration
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({
    status: 201,
    description: "User registered successfully",
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 409, description: "Email already registered" })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("verify-email")
  @ApiOperation({ summary: "Verify email with token" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        token: { type: "string", example: "abc123..." },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Email verified successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  async verifyEmail(@Body("token") token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post("login")
  // Stricter limit: 5 attempts per minute per IP
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Login with email and password" })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @UseGuards(RefreshGuard)
  @Post("refresh")
  // Less strict: 20 refreshes per minute
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: "Refresh access token" })
  @ApiBody({
    schema: {
      type: "object",
      properties: { refresh_token: { type: "string" } },
    },
  })
  @ApiResponse({
    status: 200,
    description: "New tokens generated",
    type: TokenResponseDto,
  })
  async refresh(@Req() req: Request) {
    const refreshToken = req.body.refresh_token as string;
    const user = req.user as { userId: string; email: string; role: string };
    return this.authService.refreshTokens(user.userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  // No need to throttle logout, but keep default
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Logout" })
  @ApiResponse({ status: 200, description: "Logged out successfully" })
  async logout(@Req() req: Request) {
    const user = req.user as { userId: string; email: string; role: string };
    return this.authService.logout(user.userId);
  }

  // ─── REQUEST PASSWORD RESET ─────────────────────────────────────────
  @Public()
  @Post("request-reset")
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // Stricter: 3 per minute
  @ApiOperation({ summary: "Request a password reset email" })
  @ApiResponse({
    status: 200,
    description: "Reset email sent (if account exists)",
    type: ResetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid email or account disabled",
  })
  async requestPasswordReset(@Body() dto: RequestResetDto) {
    return this.authService.requestPasswordReset(dto.email!);
  }

  // ─── RESET PASSWORD ──────────────────────────────────────────────────
  @Public()
  @Post("reset-password")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Reset password with token" })
  @ApiResponse({
    status: 200,
    description: "Password reset successful",
    type: ResetResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token!, dto.newPassword!);
  }
}
