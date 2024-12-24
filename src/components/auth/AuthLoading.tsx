import { Spinner } from '@/components/ui/spinner';

export function AuthLoading() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Spinner className="h-12 w-12 text-blue-600 mx-auto" />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Loading...
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please wait while we verify your session
          </p>
        </div>
      </div>
    </div>
  );
} 