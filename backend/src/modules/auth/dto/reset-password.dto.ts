// backend/src/modules/auth/dto/reset-password.dto.ts
import { IsString, MinLength, IsDefined } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIs...",
    description: "Reset token received via email",
  })
  @IsDefined()
  @IsString()
  token?: string;

  @ApiProperty({
    example: "NewPassword123!",
    description: "New password (min 8 characters)",
    minLength: 8,
  })
  @IsDefined()
  @IsString()
  @MinLength(8)
  newPassword?: string;
}
