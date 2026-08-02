// frontend/src/types/notes.ts

/**
 * Note entity - matches backend NoteResponseDto
 */
export interface Note {
  id: string;
  title: string;
  content?: string | null;
  color?: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new note
 */
export interface CreateNoteDto {
  title: string;
  content?: string;
  color?: string;
}

/**
 * DTO for updating a note (all fields optional)
 */
export interface UpdateNoteDto {
  title?: string;
  content?: string;
  color?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
}

/**
 * Paginated notes response
 */
export interface NotesResponse {
  data: Note[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Notes query parameters
 */
export interface NotesQueryParams {
  search?: string;
  isArchived?: boolean;
  isFavorite?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Notes filter state
 */
export interface NotesFilterState {
  search: string;
  isArchived: boolean;
  isFavorite: boolean;
}
