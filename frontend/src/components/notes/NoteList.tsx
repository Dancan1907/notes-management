// frontend/src/components/notes/NoteList.tsx

"use client";

import { Note } from "@/types/notes";
import NoteCard from "./NoteCard";
import { Plus } from "lucide-react";

interface NoteListProps {
  notes: Note[];
  loading: boolean;
  onToggleFavorite: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
  emptyMessage?: string;
}

/**
 * NoteList - Displays a grid of note cards
 *
 * Features:
 * - Responsive grid layout
 * - Empty state with create button
 * - Loading skeleton
 */
export const NoteList = ({
  notes,
  loading,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
  onCreateNew,
  emptyMessage = "No notes yet. Create your first note!",
}: NoteListProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">{emptyMessage}</p>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Note
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onToggleFavorite={onToggleFavorite}
          onToggleArchive={onToggleArchive}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default NoteList;
