// backend/src/modules/notes/notes.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";
import { NoteResponseDto } from "./dto/note-response.dto";
import { PinoLogger } from "nestjs-pino";

/**
 * Notes Service - Business logic for note management
 *
 * Responsibilities:
 * - CRUD operations for notes
 * - Ownership validation (users can only access their own notes)
 * - Search and filtering
 * - Pagination support
 * - Logging all operations for audit trail
 */
@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NotesService.name);
  }

  /**
   * Create a new note for a user
   *
   * @param userId - The ID of the authenticated user
   * @param createNoteDto - Note data (title, content, color)
   * @returns The created note as NoteResponseDto
   */
  async createNote(
    userId: string,
    createNoteDto: CreateNoteDto,
  ): Promise<NoteResponseDto> {
    this.logger.info({ userId, noteData: createNoteDto }, "Creating new note");

    try {
      const note = await this.prisma.note.create({
        data: {
          title: createNoteDto.title,
          content: createNoteDto.content,
          color: createNoteDto.color,
          userId: userId,
        },
      });

      this.logger.info(
        { noteId: note.id, userId },
        "Note created successfully",
      );
      return this.toResponseDto(note);
    } catch (error) {
      this.logger.error({ error, userId }, "Failed to create note");
      throw error;
    }
  }

  /**
   * Get all notes for a user with filtering, search, and pagination
   *
   * @param userId - The ID of the authenticated user
   * @param options - Query options (search, isArchived, isFavorite, limit, offset)
   * @returns Paginated list of notes
   */
  async getNotes(
    userId: string,
    options: {
      search?: string;
      isArchived?: boolean;
      isFavorite?: boolean;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const { search, isArchived, isFavorite, limit = 10, offset = 0 } = options;

    this.logger.info({ userId, options }, "Fetching notes with filters");

    // Build the where clause for filtering
    const where: any = {
      userId: userId,
    };

    // Filter by archive status (if specified)
    if (isArchived !== undefined) {
      where.isArchived = isArchived;
    }

    // Filter by favorite status (if specified)
    if (isFavorite !== undefined) {
      where.isFavorite = isFavorite;
    }

    // Search by title or content (if search term provided)
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { content: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    try {
      // Execute parallel queries for data and total count (performance optimization)
      const [notes, total] = await Promise.all([
        this.prisma.note.findMany({
          where,
          orderBy: [
            { isFavorite: "desc" }, // Favorites first
            { updatedAt: "desc" }, // Most recently updated first
          ],
          skip: offset,
          take: limit,
        }),
        this.prisma.note.count({ where }),
      ]);

      this.logger.info(
        { userId, notesFound: notes.length, total },
        "Notes fetched successfully",
      );

      return {
        data: notes.map(this.toResponseDto),
        total,
        limit,
        offset,
        hasMore: offset + notes.length < total,
      };
    } catch (error) {
      this.logger.error({ error, userId }, "Failed to fetch notes");
      throw error;
    }
  }

  /**
   * Get a single note by ID with ownership validation
   *
   * @param userId - The ID of the authenticated user
   * @param noteId - The ID of the note to retrieve
   * @returns The note as NoteResponseDto
   * @throws NotFoundException if note doesn't exist
   * @throws ForbiddenException if note doesn't belong to the user
   */
  async getNoteById(userId: string, noteId: string): Promise<NoteResponseDto> {
    this.logger.info({ userId, noteId }, "Fetching note by ID");

    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      this.logger.warn({ userId, noteId }, "Note not found");
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }

    // Security: Verify the note belongs to the user
    if (note.userId !== userId) {
      this.logger.warn(
        { userId, noteId, noteOwnerId: note.userId },
        "User attempted to access another user's note",
      );
      throw new ForbiddenException("You do not have access to this note");
    }

    this.logger.info({ noteId, userId }, "Note retrieved successfully");
    return this.toResponseDto(note);
  }

  /**
   * Update an existing note with ownership validation
   *
   * @param userId - The ID of the authenticated user
   * @param noteId - The ID of the note to update
   * @param updateNoteDto - Updated note data (partial)
   * @returns The updated note as NoteResponseDto
   * @throws NotFoundException if note doesn't exist
   * @throws ForbiddenException if note doesn't belong to the user
   */
  async updateNote(
    userId: string,
    noteId: string,
    updateNoteDto: UpdateNoteDto,
  ): Promise<NoteResponseDto> {
    this.logger.info(
      { userId, noteId, updates: updateNoteDto },
      "Updating note",
    );

    // First verify the note exists and belongs to the user
    await this.getNoteById(userId, noteId); // This will throw if access denied

    try {
      const updatedNote = await this.prisma.note.update({
        where: { id: noteId },
        data: {
          title: updateNoteDto.title,
          content: updateNoteDto.content,
          color: updateNoteDto.color,
          isFavorite: updateNoteDto.isFavorite,
          isArchived: updateNoteDto.isArchived,
          updatedAt: new Date(), // Explicitly update timestamp
        },
      });

      this.logger.info({ noteId, userId }, "Note updated successfully");
      return this.toResponseDto(updatedNote);
    } catch (error) {
      // Handle Prisma record not found error (shouldn't happen due to getNoteById check)
      if (error.code === "P2025") {
        throw new NotFoundException(`Note with ID ${noteId} not found`);
      }
      this.logger.error({ error, userId, noteId }, "Failed to update note");
      throw error;
    }
  }

  /**
   * Delete a note with ownership validation
   *
   * @param userId - The ID of the authenticated user
   * @param noteId - The ID of the note to delete
   * @throws NotFoundException if note doesn't exist
   * @throws ForbiddenException if note doesn't belong to the user
   */
  async deleteNote(userId: string, noteId: string): Promise<void> {
    this.logger.info({ userId, noteId }, "Deleting note");

    // First verify the note exists and belongs to the user
    await this.getNoteById(userId, noteId); // This will throw if access denied

    try {
      await this.prisma.note.delete({
        where: { id: noteId },
      });

      this.logger.info({ noteId, userId }, "Note deleted successfully");
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`Note with ID ${noteId} not found`);
      }
      this.logger.error({ error, userId, noteId }, "Failed to delete note");
      throw error;
    }
  }

  /**
   * Toggle favorite status of a note (convenience method)
   *
   * @param userId - The ID of the authenticated user
   * @param noteId - The ID of the note to toggle
   * @returns The updated note as NoteResponseDto
   */
  async toggleFavorite(
    userId: string,
    noteId: string,
  ): Promise<NoteResponseDto> {
    this.logger.info({ userId, noteId }, "Toggling favorite status");

    const note = await this.getNoteById(userId, noteId);
    return this.updateNote(userId, noteId, {
      isFavorite: !note.isFavorite,
    });
  }

  /**
   * Toggle archive status of a note (convenience method)
   *
   * @param userId - The ID of the authenticated user
   * @param noteId - The ID of the note to toggle
   * @returns The updated note as NoteResponseDto
   */
  async toggleArchive(
    userId: string,
    noteId: string,
  ): Promise<NoteResponseDto> {
    this.logger.info({ userId, noteId }, "Toggling archive status");

    const note = await this.getNoteById(userId, noteId);
    return this.updateNote(userId, noteId, {
      isArchived: !note.isArchived,
    });
  }

  /**
   * Convert Prisma Note model to Response DTO
   *
   * This method ensures consistent response format across all endpoints
   * and excludes internal fields (like userId) from the response
   *
   * @param note - Prisma Note model
   * @returns Formatted NoteResponseDto
   */
  private toResponseDto(note: any): NoteResponseDto {
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      color: note.color,
      isFavorite: note.isFavorite,
      isArchived: note.isArchived,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
