// frontend/src/app/dashboard/notes/new/page.tsx

"use client";

import { useNotes } from "@/hooks/useNotes";
import NoteEditor from "@/components/notes/NoteEditor";

/**
 * Create New Note Page
 *
 * Renders the note editor in create mode
 */
export default function CreateNotePage() {
  const { createNote } = useNotes();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <NoteEditor onSave={createNote} isLoading={false} />
    </div>
  );
}
