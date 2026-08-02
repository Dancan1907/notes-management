// backend/src/modules/users/dto/update-user.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsBoolean, IsOptional, IsEnum } from "class-validator";
import { Role } from "@prisma/client";

export class UpdateUserDto {
  @ApiPropertyOptional({ example: "Jane Doe", description: "User name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Activate or deactivate user",
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    enum: Role,
    example: Role.ADMIN,
    description: "User role",
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
