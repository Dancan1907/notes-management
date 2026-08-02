// backend/src/modules/users/dto/change-role.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { Role } from "@prisma/client";

export class ChangeRoleDto {
  @ApiProperty({
    enum: Role,
    example: Role.ADMIN,
    description: "New role for the user",
  })
  @IsEnum(Role)
  role?: Role;
}
