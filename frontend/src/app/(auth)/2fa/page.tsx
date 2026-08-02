// frontend/src/app/(auth)/2fa/page.tsx
"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { isAxiosError } from "axios";

function TwoFactorContent() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tempToken = searchParams.get("token");
  const { verify2fa } = useAuth();

  useEffect(() => {
    if (!tempToken) {
      router.push("/login");
    }
  }, [tempToken, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tempToken) return;

    setError(null);
    setIsLoading(true);

    try {
      await verify2fa(code, tempToken);
      router.push("/dashboard");
    } catch (err: unknown) {
      let errorMessage = "Invalid code";
      if (isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
          Two-Factor Authentication
        </h2>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Enter the 6-digit code from your authenticator app.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default function TwoFactorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <TwoFactorContent />
    </Suspense>
  );
}
