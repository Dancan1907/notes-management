// backend/src/modules/notes/dto/create-note.dto.ts

import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsHexColor,
} from "class-validator";

/**
 * DTO for creating a new note
 *
 * Validates that:
 * - Title is required and within 255 characters
 * - Content is optional (for empty notes)
 * - Color is optional and must be a valid hex code
 */
export class CreateNoteDto {
  @ApiProperty({
    description: "Title of the note (required)",
    example: "My First Note",
    maxLength: 255,
  })
  @IsNotEmpty({ message: "Title is required" })
  @IsString({ message: "Title must be a string" })
  @MaxLength(255, { message: "Title must not exceed 255 characters" })
  title?: string;

  @ApiProperty({
    description: "Content of the note (optional, supports Markdown)",
    example: "This is my first note content...",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Content must be a string" })
  content?: string;

  @ApiProperty({
    description: "Color code for the note (optional, hex format)",
    example: "#f9f9f9",
    required: false,
    pattern: "^#[0-9a-fA-F]{6}$",
  })
  @IsOptional()
  @IsHexColor({
    message: "Color must be a valid hex color code (e.g., #f9f9f9)",
  })
  color?: string;
}
