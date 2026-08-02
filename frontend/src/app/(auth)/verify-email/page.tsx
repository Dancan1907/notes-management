// frontend/src/app/(auth)/verify-email/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import api from "@/lib/axios";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.post("/auth/verify-email", { token });
        setStatus("success");
        setMessage(response.data.message || "Email verified successfully!");
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (err: unknown) {
        let errorMessage = "Verification failed. Please try again.";
        if (isAxiosError(err)) {
          errorMessage = err.response?.data?.message || errorMessage;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setStatus("error");
        setMessage(errorMessage);
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
        {status === "loading" && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verifying...
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Please wait while we verify your email.
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
              ✓ Verified!
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{message}</p>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Redirecting to login...
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
              ✗ Error
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{message}</p>
            <button
              onClick={() => router.push("/login")}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
