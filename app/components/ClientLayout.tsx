'use client';

import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData } = useAuth();

  return (
    <>
      <header>
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
                    {/* Ajoutez ici votre logique de déconnexion si nécessaire */}
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
        </nav>
      </header>
      
      <main>{children}</main>
      
      <footer className="bg-gray-800 text-white py-6 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center">© {new Date().getFullYear()} Plateforme de Formation</p>
        </div>
      </footer>
    </>
  );
} 