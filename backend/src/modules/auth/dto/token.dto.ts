import { ApiProperty } from "@nestjs/swagger";

export class TokenResponseDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIs...",
    description: "JWT access token (valid for 15 minutes)",
  })
  access_token?: string;

  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIs...",
    description: "JWT refresh token (valid for 7 days)",
  })
  refresh_token?: string;

  @ApiProperty({
    example: 900,
    description: "Access token expiry time in seconds (15 minutes)",
  })
  expires_in?: number;
}
