'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import useFormations from '../../hooks/useFormations';
import Link from 'next/link';

export default function GestionSignaturesPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { getFormationsFormateur, loading: formationsLoading } = useFormations();
  const router = useRouter();
  
  const [formations, setFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    // Vérifier que l'utilisateur est un formateur
    if (userData?.role !== 'formateur') {
      router.push('/formations');
      return;
    }
    
    const fetchFormations = async () => {
      try {
        const formationsData = await getFormationsFormateur(user.uid);
        setFormations(formationsData);
      } catch (error) {
        console.error('Erreur lors de la récupération des formations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFormations();
  }, [user, userData, authLoading, router]);
  
  if (loading || authLoading || formationsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Gestion des signatures
        </h1>
        
        {formations.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <p className="text-gray-500">
              Vous n&apos;avez pas encore créé de formation.
            </p>
            <Link
              href="/formations/create"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Créer une formation
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {formations.map((formation) => (
                <li key={formation.id}>
                  <Link
                    href={`/signatures/gestion/${formation.id}`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {formation.titre}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Gérer les signatures
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {formation.description?.substring(0, 100)}
                            {formation.description?.length > 100 ? '...' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 