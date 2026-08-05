// frontend/src/app/dashboard/notes/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotes } from '@/hooks/useNotes';
import NoteList from '@/components/notes/NoteList';
import NoteSearchBar from '@/components/notes/NoteSearchBar';
import NoteFilters from '@/components/notes/NoteFilters';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Notes Dashboard Page
 *
 * Displays all notes with search, filters, and pagination
 */
export default function NotesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isArchived, setIsArchived] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const {
    notes,
    total,
    loading,
    params,
    deleteNote,
    toggleFavorite,
    toggleArchive,
    setFilters,
    setPage,
    resetFilters,
    hasMore,
  } = useNotes({
    search,
    isArchived,
    isFavorite,
    limit: 12,
  });

  const handleCreateNote = () => {
    router.push('/dashboard/notes/new');
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setFilters({ search: value });
  };

  const handleArchivedChange = (value: boolean) => {
    setIsArchived(value);
    setFilters({ isArchived: value });
  };

  const handleFavoriteChange = (value: boolean) => {
    setIsFavorite(value);
    setFilters({ isFavorite: value });
  };

  const handleResetFilters = () => {
    setSearch('');
    setIsArchived(false);
    setIsFavorite(false);
    resetFilters();
  };

  const handlePrevPage = () => {
    const newOffset = Math.max(0, (params.offset || 0) - (params.limit || 12));
    setPage(newOffset);
  };

  const handleNextPage = () => {
    const newOffset = (params.offset || 0) + (params.limit || 12);
    setPage(newOffset);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} {total === 1 ? 'note' : 'notes'} found
          </p>
        </div>
        <button
          onClick={handleCreateNote}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg
                   hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5" />
          New Note
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <NoteSearchBar value={search} onChange={handleSearchChange} />
        <div className="flex items-center gap-2">
          <NoteFilters
            isArchived={isArchived}
            isFavorite={isFavorite}
            onArchivedChange={handleArchivedChange}
            onFavoriteChange={handleFavoriteChange}
            onReset={handleResetFilters}
          />
          {(search || isArchived || isFavorite) && (
            <button
              onClick={handleResetFilters}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 
                       dark:hover:text-gray-300 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Notes Grid */}
      <NoteList
        notes={notes}
        loading={loading}
        onToggleFavorite={toggleFavorite}
        onToggleArchive={toggleArchive}
        onDelete={deleteNote}
        onCreateNew={handleCreateNote}
        emptyMessage={
          search || isArchived || isFavorite
            ? 'No notes match your filters. Try adjusting your search.'
            : 'You have no notes yet. Create your first note!'
        }
      />

      {/* Pagination */}
      {!loading && notes.length > 0 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {params.offset! + 1} to {params.offset! + notes.length} of {total} notes
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={params.offset === 0}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700
                       hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 
                       disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={!hasMore}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700
                       hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 
                       disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
