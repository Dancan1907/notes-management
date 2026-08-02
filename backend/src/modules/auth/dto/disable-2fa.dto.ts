import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class Disable2faDto {
  @ApiProperty({
    description: "Current password for confirmation",
    example: "Password123!",
  })
  @IsString()
  @IsNotEmpty()
  password?: string;
}
