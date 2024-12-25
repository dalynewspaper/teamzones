'use client';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Button 
      variant="ghost" 
      onClick={handleSignOut}
    >
      Sign Out
    </Button>
  );
} 