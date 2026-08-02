import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsDefined,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({
    example: "user@example.com",
    description: "User email address",
  })
  @IsDefined()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: "Password123!",
    description: "User password (min 8 characters)",
    minLength: 8,
  })
  @IsDefined()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({
    example: "John Doe",
    description: "User full name (optional)",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
}
