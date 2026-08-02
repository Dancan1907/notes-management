// backend/src/modules/files/files.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as fs from "fs";
import * as path from "path";
import { Logger } from "nestjs-pino";

@Injectable()
export class FilesService {
  private readonly uploadDir = path.join(process.cwd(), "uploads", "avatars");

  constructor(
    private prisma: PrismaService,
    private logger: Logger,
  ) {
    // Create upload directory if it doesn't exist
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Upload directory created: ${this.uploadDir}`);
    }
  }

  /**
   * Upload an avatar image for a user
   */
  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    this.logger.log(`Uploading avatar for user ${userId}`);

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        "Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.",
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException("File too large. Maximum size is 5MB.");
    }

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `avatar-${userId}-${Date.now()}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    // Save file to disk
    try {
      await fs.promises.writeFile(filePath, file.buffer);
    } catch (error) {
      this.logger.error({ error }, `Failed to save avatar for user ${userId}`);
      throw new BadRequestException("Failed to save file");
    }

    // Construct URL (served statically)
    const url = `/uploads/avatars/${filename}`;

    // Update user's avatar field in database
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: url },
    });

    this.logger.log(`Avatar uploaded for user ${userId}: ${url}`);

    return { url };
  }

  /**
   * Delete a user's avatar
   */
  async deleteAvatar(userId: string): Promise<void> {
    this.logger.log(`Deleting avatar for user ${userId}`);

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.avatar) {
      throw new NotFoundException("No avatar found");
    }

    // Extract filename from URL
    const filename = path.basename(user.avatar);
    const filePath = path.join(this.uploadDir, filename);

    // Delete file from disk
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      this.logger.error(
        { error },
        `Failed to delete avatar file for user ${userId}`,
      );
      // Continue anyway – we'll update the database
    }

    // Clear avatar field in database
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
    });

    this.logger.log(`Avatar deleted for user ${userId}`);
  }
}
