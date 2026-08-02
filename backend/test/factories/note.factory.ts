// backend/test/factories/note.factory.ts

import { PrismaService } from "../../src/modules/prisma/prisma.service";
import { CreateNoteDto } from "../../src/modules/notes/dto/create-note.dto";

/**
 * Factory for creating test notes in the database
 * Used in integration tests to set up test data
 */
export class NoteFactory {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a note with default or custom data
   */
  async createNote(
    userId: string,
    data: Partial<CreateNoteDto> & {
      isFavorite?: boolean;
      isArchived?: boolean;
    } = {},
  ) {
    const defaultData = {
      title: "Test Note",
      content: "This is a test note content",
      color: "#f9f9f9",
      isFavorite: false,
      isArchived: false,
    };

    const noteData = { ...defaultData, ...data };

    return this.prisma.note.create({
      data: {
        title: noteData.title!,
        content: noteData.content,
        color: noteData.color,
        isFavorite: noteData.isFavorite!,
        isArchived: noteData.isArchived!,
        userId: userId,
      },
    });
  }

  /**
   * Create multiple notes for a user
   */
  async createManyNotes(
    userId: string,
    count: number,
    overrides: Partial<CreateNoteDto> & {
      isFavorite?: boolean;
      isArchived?: boolean;
    } = {},
  ) {
    const notes = [];
    for (let i = 0; i < count; i++) {
      const note = await this.createNote(userId, {
        title: `Test Note ${i + 1}`,
        content: `Content for test note ${i + 1}`,
        color: i % 2 === 0 ? "#f9f9f9" : "#ff6b6b",
        ...overrides,
      });
      notes.push(note);
    }
    return notes;
  }

  /**
   * Clean up all notes for a user
   */
  async cleanup(userId: string) {
    await this.prisma.note.deleteMany({
      where: { userId },
    });
  }
}
