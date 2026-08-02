// backend/src/modules/auth/dto/request-reset.dto.ts
import { IsEmail, IsDefined } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RequestResetDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Email address of the account to reset",
  })
  @IsDefined()
  @IsEmail()
  email?: string;
}
