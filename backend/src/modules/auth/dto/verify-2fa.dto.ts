import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class Verify2faDto {
  @ApiProperty({ description: "TOTP code or backup code", example: "123456" })
  @IsString()
  @IsNotEmpty()
  code?: string;

  @ApiProperty({
    description: "Temporary token received from login",
    required: false,
  })
  @IsOptional()
  @IsString()
  tempToken?: string;
}
