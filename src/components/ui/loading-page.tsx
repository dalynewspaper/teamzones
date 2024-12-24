'use client';
import { Spinner } from './spinner';

export function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Spinner className="h-12 w-12 text-blue-600 mx-auto" />
        <p className="mt-4 text-sm text-gray-500">
          Loading...
        </p>
      </div>
    </div>
  );
} 