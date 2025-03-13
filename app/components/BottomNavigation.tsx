'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function BottomNavigation() {
  const { user, userData, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Fonction pour déterminer si un lien est actif
  const isActive = (path) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/signin');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-full z-50 hidden max-[1030px]:block">
      <div className="flex items-center h-12 px-2 space-x-0.5">
        <Link 
          href="/" 
          className={`flex items-center justify-center h-9 px-3 rounded-full transition-all duration-200 ${
            isActive('/') 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {isActive('/') && <span className="ml-1 text-xs font-medium">Accueil</span>}
        </Link>

        {user && (
          <Link 
            href="/dashboard" 
            className={`flex items-center justify-center h-9 px-3 rounded-full transition-all duration-200 ${
              isActive('/dashboard') 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {isActive('/dashboard') && <span className="ml-1 text-xs font-medium">Tableau</span>}
          </Link>
        )}

        <Link 
          href="/formations" 
          className={`flex items-center justify-center h-9 px-3 rounded-full transition-all duration-200 ${
            isActive('/formations') 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {isActive('/formations') && <span className="ml-1 text-xs font-medium">Formations</span>}
        </Link>

        {userData?.role === 'eleve' && (
          <Link 
            href="/resultats/eleve" 
            className={`flex items-center justify-center h-9 px-3 rounded-full transition-all duration-200 ${
              isActive('/resultats/eleve') 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {isActive('/resultats/eleve') && <span className="ml-1 text-xs font-medium">Résultats</span>}
          </Link>
        )}

        {userData?.role === 'formateur' && (
          <Link 
            href="/resultats/gestion" 
            className={`flex items-center justify-center h-9 px-3 rounded-full transition-all duration-200 ${
              isActive('/resultats/gestion') 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {isActive('/resultats/gestion') && <span className="ml-1 text-xs font-medium">Résultats</span>}
          </Link>
        )}

        {userData?.role === 'formateur' && (
          <Link 
            href="/signatures/gestion" 
            className={`flex items-center justify-center h-9 px-3 rounded-full transition-all duration-200 ${
              isActive('/signatures/gestion') 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            {isActive('/signatures/gestion') && <span className="ml-1 text-xs font-medium">Signatures</span>}
          </Link>
        )}
        
        {/* Bouton de connexion/déconnexion */}
        {user ? (
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center h-9 px-3 rounded-full transition-all duration-200 text-gray-600 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isActive('/auth/signout') && <span className="ml-1 text-xs font-medium">Déconnexion</span>}
          </button>
        ) : (
          <Link 
            href="/auth/signin" 
            className={`flex items-center justify-center h-9 px-3 rounded-full transition-all duration-200 ${
              isActive('/auth/signin') || isActive('/auth/signup')
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            {(isActive('/auth/signin') || isActive('/auth/signup')) && <span className="ml-1 text-xs font-medium">Connexion</span>}
          </Link>
        )}
      </div>
    </div>
  );
}
