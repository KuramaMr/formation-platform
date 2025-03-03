'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navigation() {
  const { user, userData, signOut } = useAuth();
  const router = useRouter();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/signin');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };
  
  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-white font-bold">
                Formation App
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Accueil
                </Link>
                
                {user && (
                  <Link
                    href="/dashboard"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Tableau de bord
                  </Link>
                )}
                
                <Link
                  href="/formations"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Formations
                </Link>
                
                {userData?.role === 'formateur' && (
                  <>
                    <Link
                      href="/resultats/gestion"
                      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Gestion des résultats
                    </Link>
                    <Link
                      href="/signatures/gestion"
                      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Gestion des signatures
                    </Link>
                  </>
                )}
                
                {userData?.role === 'eleve' && (
                  <Link
                    href="/resultats/eleve"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Mes résultats
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div>
            {user ? (
              <div className="flex items-center">
                <span className="text-gray-300 mr-4">{userData?.displayName}</span>
                <button
                  onClick={handleSignOut}
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Menu mobile */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            href="/"
            className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          >
            Accueil
          </Link>
          
          {user && (
            <Link
              href="/dashboard"
              className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            >
              Tableau de bord
            </Link>
          )}
          
          <Link
            href="/formations"
            className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          >
            Formations
          </Link>
          
          {userData?.role === 'formateur' && (
            <>
              <Link
                href="/resultats/gestion"
                className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
              >
                Gestion des résultats
              </Link>
              <Link
                href="/signatures/gestion"
                className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
              >
                Gestion des signatures
              </Link>
            </>
          )}
          
          {userData?.role === 'eleve' && (
            <Link
              href="/resultats/eleve"
              className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            >
              Mes résultats
            </Link>
          )}
          
          {user && (
            <button
              onClick={handleSignOut}
              className="text-gray-300 hover:bg-gray-700 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium"
            >
              Déconnexion
            </button>
          )}
        </div>
      </div>
    </nav>
  );
} 