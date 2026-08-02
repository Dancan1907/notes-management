// backend/src/modules/notes/dto/note-response.dto.ts

import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for returning note data in API responses
 *
 * Excludes sensitive information like userId from the response
 * but includes all note properties for frontend display
 */
export class NoteResponseDto {
  @ApiProperty({
    description: "Unique note identifier",
    example: "clxyz1234567",
  })
  id?: string;

  @ApiProperty({
    description: "Note title",
    example: "My First Note",
  })
  title?: string;

  @ApiProperty({
    description: "Note content (Markdown supported)",
    example: "This is my first note content...",
    required: false,
  })
  content?: string;

  @ApiProperty({
    description: "Color code for visual organization",
    example: "#f9f9f9",
    required: false,
  })
  color?: string;

  @ApiProperty({
    description: "Whether note is marked as favorite",
    example: false,
  })
  isFavorite?: boolean;

  @ApiProperty({
    description: "Whether note is archived",
    example: false,
  })
  isArchived?: boolean;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2024-01-15T10:30:00Z",
  })
  createdAt?: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2024-01-15T10:30:00Z",
  })
  updatedAt?: Date;
}
