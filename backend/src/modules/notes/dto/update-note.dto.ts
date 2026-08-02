// backend/src/modules/notes/dto/update-note.dto.ts

import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  MaxLength,
  IsHexColor,
  IsBoolean,
} from "class-validator";

/**
 * DTO for updating an existing note
 *
 * All fields are optional - only provided fields will be updated.
 * Useful for partial updates like toggling favorite/archive status.
 */
export class UpdateNoteDto {
  @ApiProperty({
    description: "Updated title of the note",
    example: "Updated Note Title",
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Title must be a string" })
  @MaxLength(255, { message: "Title must not exceed 255 characters" })
  title?: string;

  @ApiProperty({
    description: "Updated content of the note",
    example: "Updated note content...",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Content must be a string" })
  content?: string;

  @ApiProperty({
    description: "Updated color code for the note",
    example: "#ff6b6b",
    required: false,
  })
  @IsOptional()
  @IsHexColor({
    message: "Color must be a valid hex color code (e.g., #f9f9f9)",
  })
  color?: string;

  @ApiProperty({
    description: "Mark note as favorite/pinned",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: "isFavorite must be a boolean" })
  isFavorite?: boolean;

  @ApiProperty({
    description: "Archive note (hide without deleting)",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: "isArchived must be a boolean" })
  isArchived?: boolean;
}
