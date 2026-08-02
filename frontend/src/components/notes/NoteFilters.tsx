// frontend/src/components/notes/NoteFilters.tsx

"use client";

import { Filter, X } from "lucide-react";
import { useState } from "react";

interface NoteFiltersProps {
  isArchived: boolean;
  isFavorite: boolean;
  onArchivedChange: (value: boolean) => void;
  onFavoriteChange: (value: boolean) => void;
  onReset: () => void;
}

/**
 * NoteFilters - Filter controls for notes
 *
 * Features:
 * - Toggle for archived notes
 * - Toggle for favorite notes
 * - Reset all filters
 */
export const NoteFilters = ({
  isArchived,
  isFavorite,
  onArchivedChange,
  onFavoriteChange,
  onReset,
}: NoteFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasFilters = isArchived || isFavorite;

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-2 px-3 py-2 rounded-lg border 
          transition-colors
          ${
            hasFilters
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          }
        `}
      >
        <Filter className="h-4 w-4" />
        <span className="text-sm">Filters</span>
        {hasFilters && <span className="w-2 h-2 rounded-full bg-blue-500" />}
      </button>

      {/* Filter Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Filters
            </h4>
            {hasFilters && (
              <button
                onClick={() => {
                  onReset();
                  setIsOpen(false);
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Reset all
              </button>
            )}
          </div>

          {/* Archived Filter */}
          <label className="flex items-center gap-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isArchived}
              onChange={(e) => onArchivedChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 
                       focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Show archived
            </span>
          </label>

          {/* Favorite Filter */}
          <label className="flex items-center gap-3 py-2 cursor-pointer border-t border-gray-100 dark:border-gray-700">
            <input
              type="checkbox"
              checked={isFavorite}
              onChange={(e) => onFavoriteChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 
                       focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Show favorites only
            </span>
          </label>
        </div>
      )}
    </div>
  );
};

export default NoteFilters;
