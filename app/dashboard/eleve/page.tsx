'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function EleveDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Rediriger si l'utilisateur n'est pas connecté ou n'est pas un élève
    if (!loading && mounted) {
      if (!user) {
        router.push('/auth/signin');
      } else if (userData?.role !== 'eleve') {
        router.push('/dashboard/formateur');
      }
    }
  }, [user, userData, loading, mounted, router]);

  if (!mounted || loading || !user || userData?.role !== 'eleve') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Tableau de bord Élève</h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Formations disponibles</h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Découvrez les formations disponibles.</p>
                  </div>
                  <div className="mt-5">
                    <Link
                      href="/formations"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Voir les formations
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Mes formations</h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Accédez aux formations auxquelles vous êtes inscrit.</p>
                  </div>
                  <div className="mt-5">
                    <Link
                      href="/formations?inscrit=true"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Mes formations
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Mes résultats</h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Consultez vos résultats aux quiz.</p>
                  </div>
                  <div className="mt-5">
                    <Link
                      href="/resultats/eleve"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Voir mes résultats
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
