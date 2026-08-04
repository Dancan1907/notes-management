// frontend/src/app/(auth)/verify-email/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import api from '@/lib/axios';
import { Mail, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (err: unknown) {
        let errorMessage = 'Verification failed. Please try again.';
        if (isAxiosError(err)) {
          errorMessage = err.response?.data?.message || errorMessage;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setStatus('error');
        setMessage(errorMessage);
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-300/30 dark:bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300/30 dark:bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-200/20 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNjY2NjY2MiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzR2LTRoNHY0aC00em0wIDB2LTRoLTR2NGg0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20 dark:opacity-10"></div>
      </div>

      {/* Verify Email Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20 dark:border-gray-700/50 text-center">
          {/* Icon */}
          <div
            className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full 
            bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-6"
          >
            {status === 'loading' && (
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            )}
            {status === 'error' && <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />}
          </div>

          {/* Loading State */}
          {status === 'loading' && (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Verifying Email 📧
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Please wait while we verify your email address.
              </p>
              <div className="mt-6 flex justify-center gap-1">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
              </div>
            </>
          )}

          {/* Success State */}
          {status === 'success' && (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                Email Verified! ✅
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{message}</p>
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-sm text-green-700 dark:text-green-300">
                  You can now sign in to your account.
                </p>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Redirecting to login...
              </p>
              <div className="mt-3 flex justify-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
              </div>
            </>
          )}

          {/* Error State */}
          {status === 'error' && (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
                Verification Failed ❌
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{message}</p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200"
                >
                  Go to Login
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => router.push('/forgot-password')}
                  className="w-full py-2.5 px-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-sm text-gray-700 dark:text-gray-300"
                >
                  Resend Verification Email
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
