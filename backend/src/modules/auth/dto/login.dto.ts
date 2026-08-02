import { IsEmail, IsString, IsDefined } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    example: "user@example.com",
    description: "User email address",
  })
  @IsDefined()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: "Password123!",
    description: "User password",
  })
  @IsDefined()
  @IsString()
  password?: string;
}
