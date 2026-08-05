// frontend/src/app/dashboard/notes/[id]/edit/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { useNotes } from '@/hooks/useNotes';
import NoteEditor from '@/components/notes/NoteEditor';
import { Note } from '@/types/notes';
import { getNoteById } from '@/lib/api/notes';

/**
 * Edit Note Page
 *
 * Loads note data and renders the note editor in edit mode
 */
export default function EditNotePage() {
  const params = useParams();
  const router = useRouter();
  const { updateNote, deleteNote } = useNotes();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const noteId = params.id as string;

  useEffect(() => {
    const fetchNote = async () => {
      try {
        setLoading(true);
        const data = await getNoteById(noteId);
        setNote(data);
      } catch (err: unknown) {
        const errorMessage =
          (isAxiosError(err) && err.response?.data?.message) || 'Failed to load note';
        setError(errorMessage);
        // Redirect after a moment
        setTimeout(() => router.push('/dashboard/notes'), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [noteId, router]);

  const handleSave = async (data: { title: string; content?: string; color?: string }) => {
    await updateNote(noteId, data);
  };

  const handleDelete = async (id: string) => {
    await deleteNote(id);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            {error || 'Note not found'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Redirecting to notes list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <NoteEditor note={note} onSave={handleSave} onDelete={handleDelete} isLoading={loading} />
    </div>
  );
}
