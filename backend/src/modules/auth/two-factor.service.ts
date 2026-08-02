// backend/src/modules/auth/two-factor.service.ts
import { Injectable } from "@nestjs/common"; // removed BadRequestException
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";
import { Logger } from "nestjs-pino";
import { PrismaService } from "../prisma/prisma.service";
import * as argon2 from "argon2";

@Injectable()
export class TwoFactorService {
  constructor(
    private prisma: PrismaService,
    private logger: Logger,
  ) {}

  async generateSecret(email: string): Promise<{
    secret: string;
    otpauthUrl: string;
    qrCodeDataUrl: string;
  }> {
    this.logger.log(`Generating 2FA secret for ${email}`);

    const secret = speakeasy.generateSecret({
      name: `YourAppName (${email})`,
      length: 20,
    });

    const otpauthUrl = secret.otpauth_url!;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    this.logger.log(`2FA secret generated for ${email}`);

    return {
      secret: secret.base32,
      otpauthUrl,
      qrCodeDataUrl,
    };
  }

  verifyTOTP(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });
  }

  async generateBackupCodes(): Promise<{
    plainCodes: string[];
    hashedCodes: string[];
  }> {
    const plainCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      plainCodes.push(code);
      const hashed = await argon2.hash(code);
      hashedCodes.push(hashed);
    }

    return { plainCodes, hashedCodes };
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { backupCodes: true },
    });

    if (!user || !user.backupCodes) {
      return false;
    }

    const storedHashes: string[] = JSON.parse(user.backupCodes);

    for (let i = 0; i < storedHashes.length; i++) {
      const isValid = await argon2.verify(storedHashes[i], code);
      if (isValid) {
        storedHashes.splice(i, 1);
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            backupCodes: JSON.stringify(storedHashes),
          },
        });
        return true;
      }
    }

    return false;
  }

  async enableTwoFactor(
    userId: string,
    secret: string,
  ): Promise<{ backupCodes: string[] }> {
    const { plainCodes, hashedCodes } = await this.generateBackupCodes();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        isTwoFactorEnabled: true,
        backupCodes: JSON.stringify(hashedCodes),
      },
    });

    this.logger.log(`2FA enabled for user ${userId}`);

    return { backupCodes: plainCodes };
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: null,
        isTwoFactorEnabled: false,
        backupCodes: null,
      },
    });

    this.logger.log(`2FA disabled for user ${userId}`);
  }

  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isTwoFactorEnabled: true },
    });
    return user?.isTwoFactorEnabled || false;
  }
}
