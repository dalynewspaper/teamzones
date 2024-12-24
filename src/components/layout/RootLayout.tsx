import { AuthProvider } from '@/contexts/AuthContext';

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
} 