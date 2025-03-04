'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function Navigation() {
  const { user, userData, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/signin');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };
  
  // Fonction pour déterminer si un lien est actif
  const isActive = (path) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  
  return (
    <nav className="bg-gray-800 text-white">
      {/* Version desktop */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo et liens principaux */}
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex-shrink-0 bg-indigo-600 h-10 w-10 rounded-md flex items-center justify-center">
                <span className="text-xl font-bold">F</span>
              </div>
              <span className="text-xl font-bold hidden sm:block">Formation App</span>
            </Link>
            
            {/* Liens de navigation desktop - Utilisation de classe personnalisée pour 990px */}
            <div className="hidden max-[990px]:hidden min-[991px]:flex ml-6 space-x-4">
              <Link 
                href="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/') ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Accueil
              </Link>
              
              {user && (
                <Link 
                  href="/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/dashboard') ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Tableau de bord
                </Link>
              )}
              
              <Link 
                href="/formations" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/formations') ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Formations
              </Link>
              
              {userData?.role === 'formateur' && (
                <>
                  <Link 
                    href="/resultats/gestion" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/resultats/gestion') ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    Gestion des résultats
                  </Link>
                  <Link 
                    href="/signatures/gestion" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/signatures/gestion') ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    Gestion des signatures
                  </Link>
                </>
              )}
              
              {userData?.role === 'eleve' && (
                <Link 
                  href="/resultats/eleve" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/resultats/eleve') ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Mes résultats
                </Link>
              )}
            </div>
          </div>
          
          {/* Profil et déconnexion - Utilisation de classe personnalisée pour 990px */}
          <div className="hidden max-[990px]:hidden min-[991px]:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="bg-indigo-600 h-8 w-8 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {userData?.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                    </span>
                  </div>
                  <span className="ml-2 text-sm text-gray-300">
                    {userData?.role === 'formateur' ? 'Formateur' : 'Élève'}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Déconnexion
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Connexion
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Inscription
                </Link>
              </>
            )}
          </div>
          
          {/* Bouton menu mobile - Utilisation de classe personnalisée pour 990px */}
          <div className="flex min-[991px]:hidden items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <span className="sr-only">Ouvrir le menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Menu mobile - Utilisation de classe personnalisée pour 990px */}
      {isMenuOpen && (
        <div className="min-[991px]:hidden bg-gray-800 pb-3 px-2">
          <div className="space-y-1 px-2 pt-2 pb-3">
            <Link 
              href="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/') ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Accueil
            </Link>
            
            {user && (
              <Link 
                href="/dashboard" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/dashboard') ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Tableau de bord
              </Link>
            )}
            
            <Link 
              href="/formations" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/formations') ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Formations
            </Link>
            
            {userData?.role === 'formateur' && (
              <>
                <Link 
                  href="/resultats/gestion" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/resultats/gestion') ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Gestion des résultats
                </Link>
                <Link 
                  href="/signatures/gestion" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/signatures/gestion') ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Gestion des signatures
                </Link>
              </>
            )}
            
            {userData?.role === 'eleve' && (
              <Link 
                href="/resultats/eleve" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/resultats/eleve') ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Mes résultats
              </Link>
            )}
          </div>
          
          {/* Profil et déconnexion mobile */}
          <div className="pt-4 pb-3 border-t border-gray-700">
            {user ? (
              <>
                <div className="flex items-center px-5">
                  <div className="bg-indigo-600 h-10 w-10 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {userData?.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">{userData?.displayName || user.email}</div>
                    <div className="text-sm font-medium text-gray-400">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 px-2">
                  <button
                    onClick={handleSignOut}
                    className="block w-full px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white text-left flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <div className="px-2 space-y-2">
                <Link
                  href="/auth/signin"
                  className="block w-full px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Connexion
                </Link>
                <Link
                  href="/auth/signup"
                  className="block w-full px-3 py-2 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Inscription
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 