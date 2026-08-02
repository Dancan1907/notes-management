// backend/src/modules/files/files.controller.ts
import {
  Controller,
  Post,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { FilesService } from "./files.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Request } from "express";

@ApiTags("Files")
@ApiBearerAuth("JWT-auth")
@Controller("files")
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("avatar")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Upload user avatar" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Avatar uploaded successfully",
    schema: {
      type: "object",
      properties: {
        url: { type: "string", example: "/uploads/avatars/avatar-abc123.jpg" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid file type or size" })
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }
    const user = req.user as { userId: string };
    return this.filesService.uploadAvatar(user.userId, file);
  }

  @Delete("avatar")
  @ApiOperation({ summary: "Delete user avatar" })
  @ApiResponse({ status: 200, description: "Avatar deleted" })
  @ApiResponse({ status: 404, description: "No avatar found" })
  async deleteAvatar(@Req() req: Request) {
    const user = req.user as { userId: string };
    await this.filesService.deleteAvatar(user.userId);
    return { message: "Avatar deleted" };
  }
}
