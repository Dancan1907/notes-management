// frontend/src/lib/api/notes.ts

import axiosInstance from "./axios";
import {
  Note,
  CreateNoteDto,
  UpdateNoteDto,
  NotesResponse,
} from "@/types/notes";

/**
 * Notes API Service - All note-related API calls
 *
 * This service handles all communication with the backend notes endpoints.
 * Uses the axios instance with automatic JWT token injection.
 */

const NOTES_BASE_URL = "/notes";

/**
 * Get all notes with optional filters and pagination
 */
export const getNotes = async (params?: {
  search?: string;
  isArchived?: boolean;
  isFavorite?: boolean;
  limit?: number;
  offset?: number;
}): Promise<NotesResponse> => {
  const response = await axiosInstance.get<NotesResponse>(NOTES_BASE_URL, {
    params,
  });
  return response.data;
};

/**
 * Get a single note by ID
 */
export const getNoteById = async (id: string): Promise<Note> => {
  const response = await axiosInstance.get<Note>(`${NOTES_BASE_URL}/${id}`);
  return response.data;
};

/**
 * Create a new note
 */
export const createNote = async (data: CreateNoteDto): Promise<Note> => {
  const response = await axiosInstance.post<Note>(NOTES_BASE_URL, data);
  return response.data;
};

/**
 * Update an existing note
 */
export const updateNote = async (
  id: string,
  data: UpdateNoteDto,
): Promise<Note> => {
  const response = await axiosInstance.patch<Note>(
    `${NOTES_BASE_URL}/${id}`,
    data,
  );
  return response.data;
};

/**
 * Delete a note
 */
export const deleteNote = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${NOTES_BASE_URL}/${id}`);
};

/**
 * Toggle favorite status of a note
 */
export const toggleFavorite = async (id: string): Promise<Note> => {
  const response = await axiosInstance.patch<Note>(
    `${NOTES_BASE_URL}/${id}/favorite`,
  );
  return response.data;
};

/**
 * Toggle archive status of a note
 */
export const toggleArchive = async (id: string): Promise<Note> => {
  const response = await axiosInstance.patch<Note>(
    `${NOTES_BASE_URL}/${id}/archive`,
  );
  return response.data;
};
