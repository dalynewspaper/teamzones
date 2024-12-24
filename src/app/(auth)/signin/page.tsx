'use client';
import { SocialSignIn } from '@/components/auth/SocialSignIn';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to TeamZones
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Record and share weekly updates with your team
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SocialSignIn />
        </div>
      </div>
    </div>
  );
} 