// frontend/src/app/dashboard/notes/new/page.tsx
'use client';

import { useNotes } from '@/hooks/useNotes';
import NoteEditor from '@/components/notes/NoteEditor';

export default function CreateNotePage() {
  const { createNote } = useNotes();

  const handleSave = async (data: { title: string; content?: string; color?: string }) => {
    await createNote(data);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <NoteEditor onSave={handleSave} isLoading={false} />
    </div>
  );
}
