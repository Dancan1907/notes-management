// backend/src/modules/files/dto/file-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class FileResponseDto {
  @ApiProperty({ example: "avatar-abc123.jpg", description: "File name" })
  filename?: string;

  @ApiProperty({
    example: "/uploads/avatars/avatar-abc123.jpg",
    description: "File URL",
  })
  url?: string;

  @ApiProperty({ example: "image/jpeg", description: "MIME type" })
  mimetype?: string;

  @ApiProperty({ example: 102400, description: "File size in bytes" })
  size?: number;
}
