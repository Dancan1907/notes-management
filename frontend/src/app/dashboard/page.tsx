// frontend/src/app/(dashboard)/page.tsx
"use client";

import { useAuth } from "@/providers/auth-provider";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name || user?.email}!
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          You are logged in as <strong>{user?.role}</strong>.
        </p>
        <button
          onClick={logout}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
