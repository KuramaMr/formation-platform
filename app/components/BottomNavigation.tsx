'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export default function BottomNavigation() {
  const { user, userData } = useAuth();
  const pathname = usePathname();

  // Fonction pour déterminer si un lien est actif
  const isActive = (path) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // Ne pas afficher au-dessus de 1030px (utilisation de max-[1030px]:block)
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 hidden max-[1030px]:block">
      <div className="flex justify-around items-center h-16">
        <Link 
          href="/" 
          className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
            isActive('/') 
              ? 'text-indigo-600 border-t-2 border-indigo-600 pt-0.5' 
              : 'text-gray-500 hover:text-indigo-500'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1 font-medium">Accueil</span>
        </Link>

        {user && (
          <Link 
            href="/dashboard" 
            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
              isActive('/dashboard') 
                ? 'text-indigo-600 border-t-2 border-indigo-600 pt-0.5' 
                : 'text-gray-500 hover:text-indigo-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs mt-1 font-medium">Tableau</span>
          </Link>
        )}

        <Link 
          href="/formations" 
          className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
            isActive('/formations') 
              ? 'text-indigo-600 border-t-2 border-indigo-600 pt-0.5' 
              : 'text-gray-500 hover:text-indigo-500'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-xs mt-1 font-medium">Formations</span>
        </Link>

        {userData?.role === 'eleve' && (
          <Link 
            href="/resultats/eleve" 
            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
              isActive('/resultats/eleve') 
                ? 'text-indigo-600 border-t-2 border-indigo-600 pt-0.5' 
                : 'text-gray-500 hover:text-indigo-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs mt-1 font-medium">Résultats</span>
          </Link>
        )}

        {userData?.role === 'formateur' && (
          <Link 
            href="/resultats/gestion" 
            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
              isActive('/resultats/gestion') 
                ? 'text-indigo-600 border-t-2 border-indigo-600 pt-0.5' 
                : 'text-gray-500 hover:text-indigo-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs mt-1 font-medium">Résultats</span>
          </Link>
        )}

        {userData?.role === 'formateur' && (
          <Link 
            href="/signatures/gestion" 
            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
              isActive('/signatures/gestion') 
                ? 'text-indigo-600 border-t-2 border-indigo-600 pt-0.5' 
                : 'text-gray-500 hover:text-indigo-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="text-xs mt-1 font-medium">Signatures</span>
          </Link>
        )}
      </div>
    </div>
  );
}
