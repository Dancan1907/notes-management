// backend/src/modules/users/dto/user-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
  @ApiProperty({ example: "clxxxxxxxxxxxxx", description: "User ID" })
  id?: string;

  @ApiProperty({ example: "user@example.com", description: "Email address" })
  email?: string;

  @ApiProperty({
    example: "John Doe",
    nullable: true,
    description: "Full name",
  })
  name?: string | null;

  @ApiProperty({
    enum: ["ADMIN", "USER"],
    example: "USER",
    description: "User role",
  })
  role?: "ADMIN" | "USER";

  @ApiProperty({ example: true, description: "Whether the account is active" })
  isActive?: boolean;

  @ApiProperty({ example: false, description: "Whether email is verified" })
  emailVerified?: boolean;

  @ApiProperty({
    example: "/uploads/avatars/avatar-abc123.jpg",
    nullable: true,
    description: "Avatar URL",
  })
  avatar?: string | null;

  @ApiProperty({
    example: "2026-07-24T10:00:00.000Z",
    description: "Creation timestamp",
  })
  createdAt?: Date;

  @ApiProperty({
    example: "2026-07-24T10:00:00.000Z",
    description: "Last update timestamp",
  })
  updatedAt?: Date;
}
