// NestJS core decorators and exceptions
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
// JwtService for signing tokens
import { JwtService } from "@nestjs/jwt";
// Prisma service to interact with database
import { PrismaService } from "../prisma/prisma.service";
// Argon2 for password hashing and verification
import * as argon2 from "argon2";
// DTOs
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
// Prisma types (User, Role)
import { User, Role } from "@prisma/client";
// Pino logger for structured logging of critical auth events
import { Logger } from "nestjs-pino";
// EmailService to send verification emails
import { EmailService } from "../email/email.service";
// randomBytes to generate a secure verification token
import { randomBytes } from "crypto";

@Injectable() // Marks this class as injectable in NestJS DI container
export class AuthService {
  // Inject PrismaService, JwtService, the Pino Logger, and EmailService
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly logger: Logger, // <-- Inject logger
    private readonly emailService: EmailService, // <-- inject EmailService
  ) {}

  // ---------- REGISTER ----------
  async register(dto: RegisterDto) {
    this.logger.log(`Registration attempt for email: ${dto.email}`);

    // 1. Check if user already exists with this email
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      this.logger.warn(
        `Registration failed: email ${dto.email} already exists`,
      );
      // throw ConflictException (HTTP 409) because email is already taken
      throw new ConflictException("Email already registered");
    }

    // 2. Hash the plain password using argon2
    // argon2.hash() automatically generates a salt and uses recommended parameters
    const hashedPassword = await argon2.hash(dto.password!);

    // 3. Generate verification token (24-hour expiry)
    const verificationToken = randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);

    // 4. Create the user in the database
    // We set default role to USER, isActive true, emailVerified false
    const user = await this.prisma.user.create({
      data: {
        email: dto.email!,
        password: hashedPassword,
        name: dto.name,
        role: Role.USER,
        isActive: true,
        emailVerified: false,
        verificationToken: verificationToken,
        verificationTokenExpiry: verificationTokenExpiry,
      },
    });

    // 5. Send verification email (don't await to avoid blocking response)
    this.emailService
      .sendVerificationEmail(dto.email!, dto.name!, verificationToken)
      .catch((error) => {
        this.logger.error(
          { error },
          `Failed to send verification email to ${dto.email}`,
        );
      });

    this.logger.log(
      `User registered: ${user.email} (ID: ${user.id}), verification email sent`,
    );

    // 6. Remove password, refreshToken, and verification fields from the user object before returning
    // Using destructuring to exclude them
    const {
      password: _password,
      refreshToken: _refreshToken,
      verificationToken: _vToken,
      verificationTokenExpiry: _vExpiry,
      ...result
    } = user;
    // Return user info plus a message prompting email verification
    return {
      user: result,
      message:
        "Registration successful. Please check your email to verify your account.",
    };
  }

  // ---------- VERIFY EMAIL ----------
  async verifyEmail(token: string) {
    this.logger.log(
      `Email verification attempt with token: ${token.substring(0, 8)}...`,
    );
    // Find user with matching verification token
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiry: { gt: new Date() }, // token must not be expired
      },
    });
    if (!user) {
      this.logger.warn(`Email verification failed: invalid or expired token`);
      throw new BadRequestException("Invalid or expired verification token");
    }
    // Check if already verified
    if (user.emailVerified) {
      this.logger.warn(
        `Email verification attempt for already verified user: ${user.email}`,
      );
      throw new BadRequestException("Email already verified");
    }
    // Update user: set emailVerified = true, clear verification token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });
    this.logger.log(`Email verified successfully: ${user.email}`);
    return { message: "Email verified successfully. You can now log in." };
  }

  // ---------- LOGIN ----------
  async login(dto: LoginDto) {
    this.logger.log(`Login attempt for email: ${dto.email}`);

    // 1. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      this.logger.warn(`Login failed: email ${dto.email} not found`);
      // If no user, return generic Unauthorized to avoid leaking info
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if email is verified
    if (!user.emailVerified) {
      this.logger.warn(`Login failed: email ${dto.email} not verified`);
      throw new UnauthorizedException(
        "Please verify your email before logging in",
      );
    }

    // 2. Check if account is active
    if (!user.isActive) {
      this.logger.warn(`Login failed: account ${dto.email} is disabled`);
      throw new UnauthorizedException("Account is disabled");
    }

    // 3. Verify password using argon2.verify()
    // This compares the provided password with the stored hash
    const isValid = await argon2.verify(user.password, dto.password!);
    if (!isValid) {
      this.logger.warn(`Login failed: invalid password for ${dto.email}`);
      throw new UnauthorizedException("Invalid credentials");
    }

    // ─── 2FA CHECK (new) ────────────────────────────────────────
    // After password validation, check if 2FA is enabled for this user
    if (user.isTwoFactorEnabled) {
      // Generate a short-lived token for 2FA verification
      const tempToken = this.jwtService.sign(
        { sub: user.id, email: user.email, scope: "2fa" },
        { secret: process.env.JWT_SECRET, expiresIn: "5m" },
      );

      this.logger.log(`2FA required for user ${user.email}`);

      // Return a special response indicating 2FA is required
      // The frontend will catch this and redirect to the 2FA verification page
      return {
        twoFactorRequired: true,
        tempToken,
        message: "Two-factor authentication required.",
      };
    }
    // ─── End 2FA CHECK ──────────────────────────────────────────

    // 4. Generate new tokens (only if 2FA is not enabled)
    const tokens = await this.generateTokens(user);

    // 5. Update user with new refresh token (this replaces any previous one)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refresh_token },
    });

    this.logger.log(`User logged in: ${user.email} (ID: ${user.id})`);

    // 6. Return user info (without sensitive fields) and tokens
    const {
      password: _password,
      refreshToken: _refreshToken,
      ...result
    } = user;
    return {
      user: result,
      ...tokens,
    };
  }

  // ---------- REFRESH TOKEN ----------
  async refreshTokens(userId: string, refreshToken: string) {
    this.logger.log(`Refresh token attempt for user ID: ${userId}`);

    // 1. Find user by ID
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    // If user doesn't exist or has no refresh token stored, reject
    if (!user || !user.refreshToken) {
      this.logger.warn(
        `Refresh failed: no valid refresh token for user ${userId}`,
      );
      throw new UnauthorizedException("Invalid refresh token");
    }

    // 2. Check if the provided refresh token matches the stored one
    if (user.refreshToken !== refreshToken) {
      this.logger.warn(
        `Refresh failed: refresh token mismatch for user ${userId}`,
      );
      throw new UnauthorizedException("Invalid refresh token");
    }

    // 3. Generate new tokens (rotate)
    const tokens = await this.generateTokens(user);

    // 4. Update user with the new refresh token (rotate)
    // This invalidates the old refresh token (one-time use)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refresh_token },
    });

    this.logger.log(`Refresh successful for user ${userId}`);

    // 5. Return new tokens
    return tokens;
  }

  // ---------- LOGOUT ----------
  async logout(userId: string) {
    this.logger.log(`Logout for user ID: ${userId}`);

    // Remove the refresh token from the database so it cannot be used again
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    this.logger.log(`User ${userId} logged out successfully`);
    return { success: true };
  }

  // ─── REQUEST PASSWORD RESET ─────────────────────────────────────────
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    this.logger.log(`Password reset requested for email: ${email}`);
    // 1. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    // 2. If user not found, still return success (security best practice)
    //    This prevents email enumeration attacks
    if (!user) {
      this.logger.warn(
        `Password reset requested for non-existent email: ${email}`,
      );
      return {
        message:
          "If an account exists with this email, you will receive a password reset link.",
      };
    }
    // 3. Check if account is active
    if (!user.isActive) {
      this.logger.warn(
        `Password reset requested for inactive account: ${email}`,
      );
      throw new BadRequestException(
        "Account is disabled. Please contact support.",
      );
    }
    // 4. Generate reset token (1-hour expiry)
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);
    // 5. Store token in database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });
    // 6. Send reset email (non-blocking)
    this.emailService
      .sendPasswordResetEmail(email, user.name, resetToken)
      .catch((error) => {
        this.logger.error(
          { error },
          `Failed to send password reset email to ${email}`,
        );
      });
    this.logger.log(`Password reset token generated for: ${email}`);
    return {
      message:
        "If an account exists with this email, you will receive a password reset link.",
    };
  }

  // ─── RESET PASSWORD ──────────────────────────────────────────────────
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Password reset attempt with token: ${token.substring(0, 8)}...`,
    );
    // 1. Find user with valid reset token (not expired)
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }, // token must not be expired
      },
    });
    if (!user) {
      this.logger.warn(`Password reset failed: invalid or expired token`);
      throw new BadRequestException("Invalid or expired reset token");
    }
    // 2. Check if account is active
    if (!user.isActive) {
      this.logger.warn(
        `Password reset attempted for inactive account: ${user.email}`,
      );
      throw new BadRequestException(
        "Account is disabled. Please contact support.",
      );
    }
    // 3. Hash the new password
    const hashedPassword = await argon2.hash(newPassword);
    // 4. Update password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    this.logger.log(`Password reset successful for: ${user.email}`);
    return {
      message:
        "Password reset successfully. You can now login with your new password.",
    };
  }

  // ---------- VALIDATE USER (for LocalStrategy) ----------
  async validateUser(email: string, password: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      this.logger.warn(`Validation failed: user ${email} not found`);
      return null;
    }

    // Verify password
    const isValid = await argon2.verify(user.password, password);
    if (!isValid) {
      this.logger.warn(`Validation failed: password mismatch for ${email}`);
      return null;
    }

    // Return user without password
    const { password: _password, ...result } = user;
    return result;
  }

  // ---------- PRIVATE: GENERATE TOKENS ----------
  private async generateTokens(user: User) {
    // Payload contains user id, email, and role (for role-based access)
    const payload = { sub: user.id, email: user.email, role: user.role };

    // Sign access token with shorter expiry and access secret
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET, // Use access secret
        expiresIn: "15m", // 15 minutes
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET, // Different secret for refresh
        expiresIn: "7d", // 7 days
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes in seconds
    };
  }
}
