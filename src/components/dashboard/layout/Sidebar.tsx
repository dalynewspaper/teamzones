'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export function Sidebar() {
  const { user } = useAuth();
  
  return (
    <aside className="w-64 bg-gray-800 text-white">
      <div className="p-6">
        <h2 className="text-xl font-bold">TeamZones</h2>
      </div>
      <nav className="mt-6">
        <ul className="space-y-2">
          <li>
            <Link 
              href="/dashboard" 
              className="block px-6 py-2 hover:bg-gray-700"
            >
              Dashboard
            </Link>
          </li>
          {/* Add more navigation items as needed */}
        </ul>
      </nav>
    </aside>
  );
} 