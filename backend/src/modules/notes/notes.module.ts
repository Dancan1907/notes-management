// backend/src/modules/notes/notes.module.ts

import { Module } from "@nestjs/common";
import { NotesController } from "./notes.controller";
import { NotesService } from "./notes.service";
import { PrismaModule } from "../prisma/prisma.module";

/**
 * Notes Module - Handles all note management operations
 *
 * This module provides CRUD operations for user notes including:
 * - Creating new notes
 * - Reading notes (single and list)
 * - Updating existing notes
 * - Deleting notes
 *
 * Features include:
 * - User isolation (users can only access their own notes)
 * - Search functionality
 * - Pagination support
 * - Favorite/Archive organization
 */
@Module({
  imports: [PrismaModule], // Import PrismaModule for database access
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService], // Export service if other modules need note access
})
export class NotesModule {}
