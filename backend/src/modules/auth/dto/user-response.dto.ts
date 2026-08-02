import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
  @ApiProperty({ example: "clxxxxxxxxxxxxx" })
  id?: string;

  @ApiProperty({ example: "user@example.com" })
  email?: string;

  @ApiProperty({ example: "John Doe", nullable: true })
  name?: string | null;

  @ApiProperty({ enum: ["ADMIN", "USER"], example: "USER" })
  role?: "ADMIN" | "USER";

  @ApiProperty({ example: true })
  isActive?: boolean;

  @ApiProperty({ example: false })
  emailVerified?: boolean;

  @ApiProperty({ example: "2026-07-23T10:00:00.000Z" })
  createdAt?: string;

  @ApiProperty({ example: "2026-07-23T10:00:00.000Z" })
  updatedAt?: string;
}
