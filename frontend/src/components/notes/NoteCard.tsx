// frontend/src/components/notes/NoteCard.tsx

'use client';

import { Note } from '@/types/notes';
import { Star, Archive, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NoteCardProps {
  note: Note;
  onToggleFavorite: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * NoteCard - Displays a single note with actions
 *
 * Features:
 * - Show title and content preview
 * - Favorite toggle (star)
 * - Archive toggle
 * - Delete button
 * - Navigate to edit page
 */
export const NoteCard = ({ note, onToggleFavorite, onToggleArchive, onDelete }: NoteCardProps) => {
  const router = useRouter();
  const [showActions, setShowActions] = useState(false);

  // Format date for display
  const formattedDate = new Date(note.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Get color style from note color
  const colorStyle = note.color ? { backgroundColor: note.color } : {};

  // Truncate content for preview
  const contentPreview = note.content
    ? note.content.length > 120
      ? `${note.content.substring(0, 120)}...`
      : note.content
    : 'No content';

  return (
    <div
      className={`
        relative group rounded-lg border border-gray-200 dark:border-gray-700 
        p-4 transition-all duration-200 hover:shadow-md hover:scale-[1.02]
        ${note.isArchived ? 'opacity-60' : ''}
      `}
      style={colorStyle}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Title */}
      <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-8">{note.title}</h3>

      {/* Content Preview */}
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{contentPreview}</p>

      {/* Footer with date */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{formattedDate}</span>
        <span className="flex items-center gap-1">
          {note.isFavorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
          {note.isArchived && <Archive className="h-3 w-3 text-gray-400" />}
        </span>
      </div>

      {/* Action Buttons */}
      <div
        className={`
          absolute top-2 right-2 flex items-center gap-1
          transition-opacity duration-200
          ${showActions ? 'opacity-100' : 'opacity-0'}
        `}
      >
        {/* Favorite Button */}
        <button
          onClick={() => onToggleFavorite(note.id)}
          className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star
            className={`h-4 w-4 ${
              note.isFavorite
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-400 hover:text-yellow-400'
            }`}
          />
        </button>

        {/* Archive Button */}
        <button
          onClick={() => onToggleArchive(note.id)}
          className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={note.isArchived ? 'Unarchive' : 'Archive'}
        >
          <Archive
            className={`h-4 w-4 ${
              note.isArchived ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
            }`}
          />
        </button>

        {/* Edit Button */}
        <button
          onClick={() => router.push(`/dashboard/notes/${note.id}/edit`)}
          className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Edit note"
        >
          <Edit2 className="h-4 w-4 text-gray-400 hover:text-blue-500" />
        </button>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(note.id)}
          className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          title="Delete note"
        >
          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
        </button>
      </div>
    </div>
  );
};

export default NoteCard;
