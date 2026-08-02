import { ApiProperty } from "@nestjs/swagger";

export class Generate2faResponseDto {
  @ApiProperty({ description: "Base32 secret for manual entry" })
  secret?: string;

  @ApiProperty({ description: "OTPAuth URL (for QR code)" })
  otpauthUrl?: string;

  @ApiProperty({ description: "QR code as data URL (PNG)" })
  qrCodeDataUrl?: string;
}
