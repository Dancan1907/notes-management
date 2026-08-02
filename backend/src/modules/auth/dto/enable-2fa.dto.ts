import { IsString, IsNotEmpty, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class Enable2faDto {
  @ApiProperty({
    description: "TOTP code from authenticator app",
    example: "123456",
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code?: string;
}
