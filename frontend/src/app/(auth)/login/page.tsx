// frontend/src/app/(auth)/login/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { isAxiosError } from "axios";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Custom error type for 2FA requirement
interface TwoFactorRequiredError extends Error {
  twoFactorRequired: true;
  tempToken: string;
}

// Type guard without 'any'
function isTwoFactorRequiredError(
  error: unknown,
): error is TwoFactorRequiredError {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const maybeError = error as Record<string, unknown>;
  return (
    "twoFactorRequired" in maybeError &&
    maybeError.twoFactorRequired === true &&
    "tempToken" in maybeError &&
    typeof maybeError.tempToken === "string"
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      // Check if it's the special 2FA required error
      if (isTwoFactorRequiredError(err)) {
        // Redirect to 2FA verification page with the temp token
        router.push(`/2fa?token=${err.tempToken}`);
        return;
      }

      // Normal error handling (invalid credentials, network, etc.)
      const message = isAxiosError(err)
        ? err.response?.data?.message
        : "Invalid credentials";
      setError(message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            <Link
              href="/forgot-password"
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Forgot your password?
            </Link>
          </p>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {"Don't have an account? "}
          <Link
            href="/register"
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
