// backend/src/modules/auth/auth.service.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { EmailService } from "../email/email.service";
import { Logger } from "nestjs-pino";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as argon2 from "argon2";
import { createMockUser } from "../../../test/factories/user.factory";

jest.mock("argon2");

describe("AuthService", () => {
  let service: AuthService;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue("mock-token"),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const dto = {
        email: "test@example.com",
        password: "Password123!",
        name: "Test User",
      };

      (argon2.hash as jest.Mock).mockResolvedValue("hashed-password");
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const mockUser = createMockUser({
        id: "new-user-id",
        email: dto.email,
        name: dto.name,
        role: "USER",
        emailVerified: false,
      });
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        refreshToken: "mock-refresh-token",
      });

      const result = await service.register(dto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(argon2.hash).toHaveBeenCalledWith(dto.password);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
      expect(result.user).toBeDefined();
      expect(result).toHaveProperty("message");
      expect(result.message).toBe(
        "Registration successful. Please check your email to verify your account.",
      );
      expect(mockLogger.log).toHaveBeenCalled();
    });

    it("should throw ConflictException if email already exists", async () => {
      const dto = {
        email: "existing@example.com",
        password: "Password123!",
        name: "Test User",
      };

      mockPrismaService.user.findUnique.mockResolvedValue(
        createMockUser({
          email: dto.email,
        }),
      );

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      const dto = {
        email: "test@example.com",
        password: "Password123!",
      };

      const mockUser = createMockUser({
        id: "user-id",
        email: dto.email,
        password: "hashed-password",
        isActive: true,
        emailVerified: true,
      });

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(argon2.verify).toHaveBeenCalledWith(
        mockUser.password,
        dto.password,
      );
      expect(result).toHaveProperty("access_token");
      expect(result).toHaveProperty("refresh_token");
    });

    it("should throw UnauthorizedException if email not verified", async () => {
      const dto = {
        email: "test@example.com",
        password: "Password123!",
      };

      const mockUser = createMockUser({
        email: dto.email,
        emailVerified: false,
        isActive: true,
      });

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if account is disabled", async () => {
      const dto = {
        email: "test@example.com",
        password: "Password123!",
      };

      const mockUser = createMockUser({
        email: dto.email,
        emailVerified: true,
        isActive: false,
      });

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if password is invalid", async () => {
      const dto = {
        email: "test@example.com",
        password: "WrongPassword!",
      };

      const mockUser = createMockUser({
        email: dto.email,
        emailVerified: true,
        isActive: true,
      });

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("verifyEmail", () => {
    it("should verify email with valid token", async () => {
      const token = "valid-token";
      const mockUser = createMockUser({
        id: "user-id",
        email: "test@example.com",
        verificationToken: token,
        verificationTokenExpiry: new Date(Date.now() + 3600000),
        emailVerified: false,
      });

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      });

      const result = await service.verifyEmail(token);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.user.update).toHaveBeenCalled();
      expect(result.message).toBe(
        "Email verified successfully. You can now log in.",
      );
    });

    it("should throw BadRequestException for invalid token", async () => {
      const token = "invalid-token";
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail(token)).rejects.toThrow();
    });
  });
});
