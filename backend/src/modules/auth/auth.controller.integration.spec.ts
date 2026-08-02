// backend/src/modules/auth/auth.controller.integration.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import * as argon2 from "argon2";
import { AppModule } from "../../app.module";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { Logger } from "nestjs-pino";
import { cleanTestDB, setupTestDB } from "../../../test/db-helper";

const mockEmailService = {
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

describe("AuthController (Integration)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    await setupTestDB();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue(mockEmailService)
      .overrideProvider(Logger)
      .useValue(mockLogger)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix("api/v1");

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
    console.log("✅ App initialized (with mocks)");
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
      console.log("✅ App closed");
    }
  }, 5000);

  beforeEach(async () => {
    await cleanTestDB();
  }, 15000);

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user", async () => {
      // Ensure email doesn't exist
      await prismaService.user.deleteMany({
        where: { email: "integration-test@example.com" },
      });

      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({
          email: "integration-test@example.com",
          password: "Password123!",
          name: "Integration Test",
        })
        .expect(201);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe("integration-test@example.com");
      expect(response.body.user.emailVerified).toBe(false);
      expect(response.body.message).toBeDefined();

      const user = await prismaService.user.findUnique({
        where: { email: "integration-test@example.com" },
      });
      expect(user).toBeDefined();
      expect(user?.emailVerified).toBe(false);
    });

    it("should return 409 if email already exists", async () => {
      const hashedPassword = await argon2.hash("Password123!");
      await prismaService.user.upsert({
        where: { email: "existing@example.com" },
        update: {
          password: hashedPassword,
          name: "Existing User",
          emailVerified: true,
          isActive: true,
          role: "USER",
        },
        create: {
          email: "existing@example.com",
          password: hashedPassword,
          name: "Existing User",
          emailVerified: true,
          isActive: true,
          role: "USER",
        },
      });

      await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({
          email: "existing@example.com",
          password: "Password123!",
          name: "Duplicate User",
        })
        .expect(409);
    });

    it("should return 400 for invalid email", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({
          email: "not-an-email",
          password: "Password123!",
          name: "Test User",
        })
        .expect(400);
    });

    it("should return 400 for short password", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({
          email: "test@example.com",
          password: "short",
          name: "Test User",
        })
        .expect(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      const hashedPassword = await argon2.hash("Password123!");
      await prismaService.user.upsert({
        where: { email: "login-test@example.com" },
        update: {
          password: hashedPassword,
          name: "Login Test",
          emailVerified: true,
          isActive: true,
          role: "USER",
        },
        create: {
          email: "login-test@example.com",
          password: hashedPassword,
          name: "Login Test",
          emailVerified: true,
          isActive: true,
          role: "USER",
        },
      });
    }, 10000);

    it("should login successfully with valid credentials", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({
          email: "login-test@example.com",
          password: "Password123!",
        })
        .expect(201);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe("login-test@example.com");
      expect(response.body.user.emailVerified).toBe(true);
      expect(response.body.access_token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
    });

    it("should return 401 for invalid password", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({
          email: "login-test@example.com",
          password: "WrongPassword!",
        })
        .expect(401);
    });

    it("should return 401 for unverified email", async () => {
      const hashedPassword = await argon2.hash("Password123!");
      await prismaService.user.upsert({
        where: { email: "unverified@example.com" },
        update: {
          password: hashedPassword,
          name: "Unverified User",
          emailVerified: false,
          isActive: true,
          role: "USER",
        },
        create: {
          email: "unverified@example.com",
          password: hashedPassword,
          name: "Unverified User",
          emailVerified: false,
          isActive: true,
          role: "USER",
        },
      });

      await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({
          email: "unverified@example.com",
          password: "Password123!",
        })
        .expect(401);
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    let refreshToken: string;

    beforeEach(async () => {
      const hashedPassword = await argon2.hash("Password123!");
      await prismaService.user.upsert({
        where: { email: "refresh-test@example.com" },
        update: {
          password: hashedPassword,
          name: "Refresh Test",
          emailVerified: true,
          isActive: true,
          role: "USER",
        },
        create: {
          email: "refresh-test@example.com",
          password: hashedPassword,
          name: "Refresh Test",
          emailVerified: true,
          isActive: true,
          role: "USER",
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({
          email: "refresh-test@example.com",
          password: "Password123!",
        });

      refreshToken = loginResponse.body.refresh_token;
    }, 10000);

    it("should refresh tokens successfully", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/refresh")
        .send({
          refresh_token: refreshToken,
        })
        .expect(201);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
      expect(response.body.refresh_token).not.toBe(refreshToken);
    });

    it("should return 401 for invalid refresh token", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/auth/refresh")
        .send({
          refresh_token: "invalid-token",
        })
        .expect(401);
    });
  });
});
