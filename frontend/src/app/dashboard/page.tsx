// frontend/src/app/(dashboard)/page.tsx
'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { Notebook, Plus } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name || user?.email}!
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You are logged in as <strong>{user?.role}</strong>.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* View Notes Card */}
        <div
          onClick={() => router.push('/dashboard/notes')}
          className="cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Notebook className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                View All Notes
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Browse and manage your notes
              </p>
            </div>
          </div>
        </div>

        {/* Create Note Card */}
        <div
          onClick={() => router.push('/dashboard/notes/new')}
          className="cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Plus className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Note
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Start writing a new note</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
