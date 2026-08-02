// backend/src/modules/notes/notes.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseBoolPipe,
  ParseIntPipe,
  Req, // ✅ Added for fallback
  UnauthorizedException, // ✅ Added for error handling
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { NotesService } from "./notes.service";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";
import { NoteResponseDto } from "./dto/note-response.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express"; // ✅ Added for type safety

/**
 * Notes Controller - REST API endpoints for note management
 *
 * All endpoints require JWT authentication and enforce user isolation.
 * Rate limiting is applied to write operations to prevent abuse.
 */
@ApiTags("Notes")
@ApiBearerAuth("JWT-auth")
@Controller("notes")
@UseGuards(JwtAuthGuard) // All endpoints require authentication
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  /**
   * Helper method to extract user ID from request
   * Tries multiple sources: CurrentUser decorator, request.user, or request.user.id
   */
  private extractUserId(userIdFromDecorator: string, req: Request): string {
    // ✅ If decorator provided a valid ID, use it
    if (userIdFromDecorator) {
      console.log(
        "✅ User ID from @CurrentUser decorator:",
        userIdFromDecorator,
      );
      return userIdFromDecorator;
    }

    // ✅ Fallback: Try to get from request.user
    console.log("🔍 @CurrentUser returned undefined, trying request.user...");
    console.log("🔍 request.user:", req.user);

    const user = req.user as any;
    if (user) {
      // Try multiple possible field names
      const userId = user.id || user.userId || user.sub;
      if (userId) {
        console.log("✅ User ID from request.user:", userId);
        return userId;
      }
    }

    // ✅ If all fail, throw error
    console.error("❌ No user ID found in request");
    throw new UnauthorizedException("User ID not found in request");
  }

  /**
   * POST /api/notes
   * Create a new note
   */
  @Post()
  @ApiOperation({ summary: "Create a new note" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Note created successfully",
    type: NoteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "User not authenticated",
  })
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // Rate limit: 30 requests per minute
  async createNote(
    @CurrentUser("id") userId: string,
    @Req() req: Request, // ✅ Added for fallback
    @Body() createNoteDto: CreateNoteDto,
  ): Promise<NoteResponseDto> {
    // ✅ Extract user ID with fallback
    const finalUserId = this.extractUserId(userId, req);
    console.log("📝 Creating note for user:", finalUserId);

    return this.notesService.createNote(finalUserId, createNoteDto);
  }

  /**
   * GET /api/notes
   * Get all notes for the authenticated user with optional filters
   */
  @Get()
  @ApiOperation({
    summary: "Get all notes with optional filters and pagination",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search notes by title or content",
    type: String,
  })
  @ApiQuery({
    name: "isArchived",
    required: false,
    description: "Filter by archive status",
    type: Boolean,
  })
  @ApiQuery({
    name: "isFavorite",
    required: false,
    description: "Filter by favorite status",
    type: Boolean,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Number of notes per page (default: 10)",
    type: Number,
  })
  @ApiQuery({
    name: "offset",
    required: false,
    description: "Number of notes to skip (default: 0)",
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Notes retrieved successfully",
    schema: {
      properties: {
        data: {
          type: "array",
          items: { $ref: "#/components/schemas/NoteResponseDto" },
        },
        total: { type: "number" },
        limit: { type: "number" },
        offset: { type: "number" },
        hasMore: { type: "boolean" },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "User not authenticated",
  })
  async getNotes(
    @CurrentUser("id") userId: string,
    @Req() req: Request, // ✅ Added for fallback
    @Query("search") search?: string,
    @Query(
      "isArchived",
      new DefaultValuePipe(false),
      new ParseBoolPipe({ optional: true }),
    )
    isArchived?: boolean,
    @Query(
      "isFavorite",
      new DefaultValuePipe(false),
      new ParseBoolPipe({ optional: true }),
    )
    isFavorite?: boolean,
    @Query(
      "limit",
      new DefaultValuePipe(10),
      new ParseIntPipe({ optional: true }),
    )
    limit?: number,
    @Query(
      "offset",
      new DefaultValuePipe(0),
      new ParseIntPipe({ optional: true }),
    )
    offset?: number,
  ) {
    // ✅ Extract user ID with fallback
    const finalUserId = this.extractUserId(userId, req);

    // Use nullish coalescing to ensure limit is always a number
    const safeLimit = limit ?? 10;
    const safeOffset = offset ?? 0;

    return this.notesService.getNotes(finalUserId, {
      search,
      isArchived,
      isFavorite,
      limit: Math.min(safeLimit, 100), // Max limit 100 to prevent overloading
      offset: safeOffset,
    });
  }

  /**
   * GET /api/notes/:id
   * Get a specific note by ID
   */
  @Get(":id")
  @ApiOperation({ summary: "Get a note by ID" })
  @ApiParam({
    name: "id",
    description: "Note ID (UUID)",
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Note retrieved successfully",
    type: NoteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Note not found",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "User does not own this note",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "User not authenticated",
  })
  async getNote(
    @CurrentUser("id") userId: string,
    @Req() req: Request, // ✅ Added for fallback
    @Param("id", ParseUUIDPipe) noteId: string,
  ): Promise<NoteResponseDto> {
    // ✅ Extract user ID with fallback
    const finalUserId = this.extractUserId(userId, req);
    return this.notesService.getNoteById(finalUserId, noteId);
  }

  /**
   * PATCH /api/notes/:id
   * Update a note (partial update supported)
   */
  @Patch(":id")
  @ApiOperation({ summary: "Update a note" })
  @ApiParam({
    name: "id",
    description: "Note ID (UUID)",
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Note updated successfully",
    type: NoteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Note not found",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "User does not own this note",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data",
  })
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // Rate limit: 30 requests per minute
  async updateNote(
    @CurrentUser("id") userId: string,
    @Req() req: Request, // ✅ Added for fallback
    @Param("id", ParseUUIDPipe) noteId: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ): Promise<NoteResponseDto> {
    // ✅ Extract user ID with fallback
    const finalUserId = this.extractUserId(userId, req);
    return this.notesService.updateNote(finalUserId, noteId, updateNoteDto);
  }

  /**
   * DELETE /api/notes/:id
   * Delete a note
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a note" })
  @ApiParam({
    name: "id",
    description: "Note ID (UUID)",
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Note deleted successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Note not found",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "User does not own this note",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "User not authenticated",
  })
  @Throttle({ default: { limit: 15, ttl: 60000 } }) // Rate limit: 15 requests per minute (more restrictive for deletes)
  async deleteNote(
    @CurrentUser("id") userId: string,
    @Req() req: Request, // ✅ Added for fallback
    @Param("id", ParseUUIDPipe) noteId: string,
  ): Promise<void> {
    // ✅ Extract user ID with fallback
    const finalUserId = this.extractUserId(userId, req);
    await this.notesService.deleteNote(finalUserId, noteId);
  }

  /**
   * PATCH /api/notes/:id/favorite
   * Toggle favorite status of a note
   */
  @Patch(":id/favorite")
  @ApiOperation({ summary: "Toggle favorite status of a note" })
  @ApiParam({
    name: "id",
    description: "Note ID (UUID)",
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Favorite status toggled successfully",
    type: NoteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Note not found",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "User does not own this note",
  })
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // Rate limit: 60 requests per minute (lightweight operation)
  async toggleFavorite(
    @CurrentUser("id") userId: string,
    @Req() req: Request, // ✅ Added for fallback
    @Param("id", ParseUUIDPipe) noteId: string,
  ): Promise<NoteResponseDto> {
    // ✅ Extract user ID with fallback
    const finalUserId = this.extractUserId(userId, req);
    return this.notesService.toggleFavorite(finalUserId, noteId);
  }

  /**
   * PATCH /api/notes/:id/archive
   * Toggle archive status of a note
   */
  @Patch(":id/archive")
  @ApiOperation({ summary: "Toggle archive status of a note" })
  @ApiParam({
    name: "id",
    description: "Note ID (UUID)",
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Archive status toggled successfully",
    type: NoteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Note not found",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "User does not own this note",
  })
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // Rate limit: 60 requests per minute (lightweight operation)
  async toggleArchive(
    @CurrentUser("id") userId: string,
    @Req() req: Request, // ✅ Added for fallback
    @Param("id", ParseUUIDPipe) noteId: string,
  ): Promise<NoteResponseDto> {
    // ✅ Extract user ID with fallback
    const finalUserId = this.extractUserId(userId, req);
    return this.notesService.toggleArchive(finalUserId, noteId);
  }
}
