// backend/src/modules/auth/dto/reset-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class ResetResponseDto {
  @ApiProperty({
    example: "Password reset successfully. You can now login.",
    description: "Success message",
  })
  message?: string;
}
