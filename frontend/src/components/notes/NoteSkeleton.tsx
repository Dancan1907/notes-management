// frontend/src/components/notes/NoteSkeleton.tsx

"use client";

/**
 * NoteSkeleton - Loading skeleton for note cards
 *
 * Displays animated placeholder cards while notes are loading
 */
export const NoteSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="h-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 animate-pulse"
        >
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
            </div>
            <div className="pt-3 flex justify-between">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              <div className="flex gap-1">
                <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NoteSkeleton;
