// backend/src/modules/notes/notes.service.spec.ts

import { Test, TestingModule } from "@nestjs/testing";
import { NotesService } from "./notes.service";
import { PrismaService } from "../prisma/prisma.service";
import { PinoLogger } from "nestjs-pino";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";

// Mock the PrismaService
const mockPrismaService = {
  note: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

// Mock the Logger
const mockLogger = {
  setContext: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

describe("NotesService", () => {
  let service: NotesService;

  const mockUserId = "user-123";
  const mockNoteId = "note-456";
  const mockNote = {
    id: mockNoteId,
    title: "Test Note",
    content: "Test content",
    color: "#f9f9f9",
    isFavorite: false,
    isArchived: false,
    userId: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createNote", () => {
    it("should create a note successfully", async () => {
      // Arrange
      const createNoteDto: CreateNoteDto = {
        title: "New Note",
        content: "New content",
        color: "#ff6b6b",
      };

      const expectedNote = {
        ...mockNote,
        title: createNoteDto.title,
        content: createNoteDto.content,
        color: createNoteDto.color,
      };

      mockPrismaService.note.create.mockResolvedValue(expectedNote);

      // Act
      const result = await service.createNote(mockUserId, createNoteDto);

      // Assert
      expect(mockPrismaService.note.create).toHaveBeenCalledWith({
        data: {
          title: createNoteDto.title,
          content: createNoteDto.content,
          color: createNoteDto.color,
          userId: mockUserId,
        },
      });
      expect(result).toEqual({
        id: expectedNote.id,
        title: expectedNote.title,
        content: expectedNote.content,
        color: expectedNote.color,
        isFavorite: expectedNote.isFavorite,
        isArchived: expectedNote.isArchived,
        createdAt: expectedNote.createdAt,
        updatedAt: expectedNote.updatedAt,
      });
    });

    it("should create a note without optional fields", async () => {
      // Arrange
      const createNoteDto: CreateNoteDto = {
        title: "Minimal Note",
      };

      mockPrismaService.note.create.mockResolvedValue({
        ...mockNote,
        title: createNoteDto.title,
        content: null,
        color: null,
      });

      // Act
      const result = await service.createNote(mockUserId, createNoteDto);

      // Assert
      expect(mockPrismaService.note.create).toHaveBeenCalledWith({
        data: {
          title: createNoteDto.title,
          content: undefined,
          color: undefined,
          userId: mockUserId,
        },
      });
      expect(result.title).toBe(createNoteDto.title);
      expect(result.content).toBeNull();
      expect(result.color).toBeNull();
    });
  });

  describe("getNotes", () => {
    it("should get all notes for a user", async () => {
      // Arrange
      const mockNotes = [
        { ...mockNote, id: "note-1" },
        { ...mockNote, id: "note-2" },
      ];
      mockPrismaService.note.findMany.mockResolvedValue(mockNotes);
      mockPrismaService.note.count.mockResolvedValue(2);

      // Act
      const result = await service.getNotes(mockUserId, {});

      // Assert
      expect(mockPrismaService.note.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
        skip: 0,
        take: 10,
      });
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it("should filter notes by isArchived", async () => {
      // Arrange
      mockPrismaService.note.findMany.mockResolvedValue([]);
      mockPrismaService.note.count.mockResolvedValue(0);

      // Act
      await service.getNotes(mockUserId, { isArchived: true });

      // Assert
      expect(mockPrismaService.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            isArchived: true,
          }),
        }),
      );
    });

    it("should filter notes by isFavorite", async () => {
      // Arrange
      mockPrismaService.note.findMany.mockResolvedValue([]);
      mockPrismaService.note.count.mockResolvedValue(0);

      // Act
      await service.getNotes(mockUserId, { isFavorite: true });

      // Assert
      expect(mockPrismaService.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            isFavorite: true,
          }),
        }),
      );
    });

    it("should search notes by title", async () => {
      // Arrange
      const searchTerm = "test";
      mockPrismaService.note.findMany.mockResolvedValue([]);
      mockPrismaService.note.count.mockResolvedValue(0);

      // Act
      await service.getNotes(mockUserId, { search: searchTerm });

      // Assert
      expect(mockPrismaService.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            OR: [
              { title: { contains: searchTerm, mode: "insensitive" } },
              { content: { contains: searchTerm, mode: "insensitive" } },
            ],
          }),
        }),
      );
    });

    it("should handle pagination correctly", async () => {
      // Arrange
      const limit = 5;
      const offset = 10;
      mockPrismaService.note.findMany.mockResolvedValue([]);
      mockPrismaService.note.count.mockResolvedValue(0);

      // Act
      await service.getNotes(mockUserId, { limit, offset });

      // Assert
      expect(mockPrismaService.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: offset,
          take: limit,
        }),
      );
    });
  });

  describe("getNoteById", () => {
    it("should get a note by ID if user owns it", async () => {
      // Arrange
      mockPrismaService.note.findUnique.mockResolvedValue(mockNote);

      // Act
      const result = await service.getNoteById(mockUserId, mockNoteId);

      // Assert
      expect(mockPrismaService.note.findUnique).toHaveBeenCalledWith({
        where: { id: mockNoteId },
      });
      expect(result).toEqual({
        id: mockNote.id,
        title: mockNote.title,
        content: mockNote.content,
        color: mockNote.color,
        isFavorite: mockNote.isFavorite,
        isArchived: mockNote.isArchived,
        createdAt: mockNote.createdAt,
        updatedAt: mockNote.updatedAt,
      });
    });

    it("should throw NotFoundException if note does not exist", async () => {
      // Arrange
      mockPrismaService.note.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getNoteById(mockUserId, "non-existent-id"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if user does not own the note", async () => {
      // Arrange
      const otherUserNote = { ...mockNote, userId: "other-user" };
      mockPrismaService.note.findUnique.mockResolvedValue(otherUserNote);

      // Act & Assert
      await expect(service.getNoteById(mockUserId, mockNoteId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("updateNote", () => {
    it("should update a note successfully", async () => {
      // Arrange
      const updateDto: UpdateNoteDto = {
        title: "Updated Title",
        content: "Updated content",
        color: "#4ecdc4",
      };

      const updatedNote = { ...mockNote, ...updateDto };
      mockPrismaService.note.findUnique.mockResolvedValue(mockNote);
      mockPrismaService.note.update.mockResolvedValue(updatedNote);

      // Act
      const result = await service.updateNote(
        mockUserId,
        mockNoteId,
        updateDto,
      );

      // Assert
      expect(mockPrismaService.note.update).toHaveBeenCalledWith({
        where: { id: mockNoteId },
        data: {
          title: updateDto.title,
          content: updateDto.content,
          color: updateDto.color,
          isFavorite: undefined,
          isArchived: undefined,
          updatedAt: expect.any(Date),
        },
      });
      expect(result.title).toBe(updateDto.title);
    });

    it("should update only provided fields", async () => {
      // Arrange
      const updateDto: UpdateNoteDto = {
        isFavorite: true,
      };

      const updatedNote = { ...mockNote, isFavorite: true };
      mockPrismaService.note.findUnique.mockResolvedValue(mockNote);
      mockPrismaService.note.update.mockResolvedValue(updatedNote);

      // Act
      const result = await service.updateNote(
        mockUserId,
        mockNoteId,
        updateDto,
      );

      // Assert
      expect(mockPrismaService.note.update).toHaveBeenCalledWith({
        where: { id: mockNoteId },
        data: {
          title: undefined,
          content: undefined,
          color: undefined,
          isFavorite: true,
          isArchived: undefined,
          updatedAt: expect.any(Date),
        },
      });
      expect(result.isFavorite).toBe(true);
    });
  });

  describe("deleteNote", () => {
    it("should delete a note successfully", async () => {
      // Arrange
      mockPrismaService.note.findUnique.mockResolvedValue(mockNote);
      mockPrismaService.note.delete.mockResolvedValue(mockNote);

      // Act
      await service.deleteNote(mockUserId, mockNoteId);

      // Assert
      expect(mockPrismaService.note.delete).toHaveBeenCalledWith({
        where: { id: mockNoteId },
      });
    });

    it("should throw NotFoundException if note does not exist", async () => {
      // Arrange
      mockPrismaService.note.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.deleteNote(mockUserId, "non-existent-id"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("toggleFavorite", () => {
    it("should toggle favorite status from false to true", async () => {
      // Arrange
      const note = { ...mockNote, isFavorite: false };
      const updatedNote = { ...mockNote, isFavorite: true };
      mockPrismaService.note.findUnique.mockResolvedValue(note);
      mockPrismaService.note.update.mockResolvedValue(updatedNote);

      // Act
      const result = await service.toggleFavorite(mockUserId, mockNoteId);

      // Assert
      expect(mockPrismaService.note.update).toHaveBeenCalledWith({
        where: { id: mockNoteId },
        data: {
          isFavorite: true,
          updatedAt: expect.any(Date),
        },
      });
      expect(result.isFavorite).toBe(true);
    });

    it("should toggle favorite status from true to false", async () => {
      // Arrange
      const note = { ...mockNote, isFavorite: true };
      const updatedNote = { ...mockNote, isFavorite: false };
      mockPrismaService.note.findUnique.mockResolvedValue(note);
      mockPrismaService.note.update.mockResolvedValue(updatedNote);

      // Act
      const result = await service.toggleFavorite(mockUserId, mockNoteId);

      // Assert
      expect(mockPrismaService.note.update).toHaveBeenCalledWith({
        where: { id: mockNoteId },
        data: {
          isFavorite: false,
          updatedAt: expect.any(Date),
        },
      });
      expect(result.isFavorite).toBe(false);
    });
  });

  describe("toggleArchive", () => {
    it("should toggle archive status from false to true", async () => {
      // Arrange
      const note = { ...mockNote, isArchived: false };
      const updatedNote = { ...mockNote, isArchived: true };
      mockPrismaService.note.findUnique.mockResolvedValue(note);
      mockPrismaService.note.update.mockResolvedValue(updatedNote);

      // Act
      const result = await service.toggleArchive(mockUserId, mockNoteId);

      // Assert
      expect(mockPrismaService.note.update).toHaveBeenCalledWith({
        where: { id: mockNoteId },
        data: {
          isArchived: true,
          updatedAt: expect.any(Date),
        },
      });
      expect(result.isArchived).toBe(true);
    });
  });
});
