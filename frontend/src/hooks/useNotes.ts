// frontend/src/hooks/useNotes.ts

import { useState, useEffect, useCallback } from "react";
import { Note, NotesQueryParams, NotesFilterState } from "@/types/notes";
import * as notesApi from "@/lib/api/notes";
import { toast } from "sonner";

/**
 * Custom hook for managing notes with loading and error states
 *
 * Features:
 * - Fetch notes with filters and pagination
 * - Create, update, delete operations
 * - Toggle favorite and archive
 * - Automatic refetch on changes
 */
export const useNotes = (initialParams: NotesQueryParams = {}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<NotesQueryParams>({
    limit: 10,
    offset: 0,
    ...initialParams,
  });

  /**
   * Fetch notes with current filters
   */
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await notesApi.getNotes(params);
      setNotes(response.data);
      setTotal(response.total);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch notes";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [params]);

  /**
   * Create a new note
   */
  const createNote = useCallback(
    async (data: { title: string; content?: string; color?: string }) => {
      try {
        const newNote = await notesApi.createNote(data);
        setNotes((prev) => [newNote, ...prev]);
        toast.success("Note created successfully!");
        return newNote;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Failed to create note";
        toast.error(errorMessage);
        throw err;
      }
    },
    [],
  );

  /**
   * Update an existing note
   */
  const updateNote = useCallback(async (id: string, data: any) => {
    try {
      const updatedNote = await notesApi.updateNote(id, data);
      setNotes((prev) =>
        prev.map((note) => (note.id === id ? updatedNote : note)),
      );
      toast.success("Note updated successfully!");
      return updatedNote;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to update note";
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Delete a note
   */
  const deleteNote = useCallback(async (id: string) => {
    try {
      await notesApi.deleteNote(id);
      setNotes((prev) => prev.filter((note) => note.id !== id));
      setTotal((prev) => prev - 1);
      toast.success("Note deleted successfully!");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete note";
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Toggle favorite status
   */
  const toggleFavorite = useCallback(async (id: string) => {
    try {
      const updatedNote = await notesApi.toggleFavorite(id);
      setNotes((prev) =>
        prev.map((note) => (note.id === id ? updatedNote : note)),
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to toggle favorite";
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Toggle archive status
   */
  const toggleArchive = useCallback(async (id: string) => {
    try {
      const updatedNote = await notesApi.toggleArchive(id);
      setNotes((prev) =>
        prev.map((note) => (note.id === id ? updatedNote : note)),
      );
      toast.success(
        updatedNote.isArchived ? "Note archived!" : "Note unarchived!",
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to toggle archive";
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Update filters and refetch
   */
  const setFilters = useCallback((newFilters: Partial<NotesFilterState>) => {
    setParams((prev) => ({
      ...prev,
      ...newFilters,
      offset: 0, // Reset pagination when filters change
    }));
  }, []);

  /**
   * Change pagination
   */
  const setPage = useCallback((offset: number) => {
    setParams((prev) => ({ ...prev, offset }));
  }, []);

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setParams({
      limit: 10,
      offset: 0,
    });
  }, []);

  // Fetch notes when params change
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    total,
    loading,
    error,
    params,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    toggleArchive,
    setFilters,
    setPage,
    resetFilters,
    hasMore: notes.length > 0 && params.offset! + notes.length < total,
  };
};
